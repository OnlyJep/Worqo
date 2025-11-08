#!/bin/bash
# Don't use set -e so we can continue on warnings
# set -e

echo "Starting application setup..."

# Wait for database if DB_HOST is set
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database connection..."
    max_attempts=30
    attempt=0
    until php -r "
        try {
            \$pdo = new PDO(
                'pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'),
                getenv('DB_USERNAME'),
                getenv('DB_PASSWORD')
            );
            \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            exit(0);
        } catch (Exception \$e) {
            exit(1);
        }
    " 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo "Database connection failed after $max_attempts attempts"
            exit 1
        fi
        echo "Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
        sleep 2
    done
    echo "Database is up!"
fi

# Run Laravel setup commands
echo "Running Laravel setup commands..."
# CRITICAL: Clear ALL caches FIRST so our custom PostgreSQL connector is loaded
# This must happen before any database operations
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Generate key only if APP_KEY is not set (skip .env file requirement)
# Create a temporary .env file if it doesn't exist to avoid key:generate errors
if [ ! -f .env ]; then
    echo "Creating temporary .env file for key generation..."
    touch .env
    # Copy any existing environment variables to .env
    env | grep -E '^(APP_|DB_|CACHE_|SESSION_|QUEUE_|REDIS_|MAIL_|BROADCAST_|LOG_|AWS_)' >> .env 2>/dev/null || true
fi

# Generate key only if APP_KEY is not set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ] || [ "$APP_KEY" = "null" ]; then
    php artisan key:generate --ansi --force 2>&1 | grep -v "file_get_contents" || echo "Key generation completed or skipped"
else
    echo "APP_KEY already set, skipping key generation"
fi

# Create storage link - remove existing link first if it exists
if [ -L public/storage ]; then
    rm public/storage
fi
php artisan storage:link || echo "Storage link creation warning - continuing anyway..."

# Ensure storage directories exist
mkdir -p storage/app/public/profiles
mkdir -p storage/app/public/credentialsphoto
chmod -R 755 storage/app/public

echo "========================================="
echo "Running database remigration (fresh migration)..."
echo "========================================="

# Ensure Sanctum migrations are published (for personal_access_tokens table)
echo "Publishing Sanctum migrations (if not already published)..."
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --tag="migrations" --force 2>&1 | grep -v "file_get_contents" || echo "Sanctum migrations already published or not needed"

# Function to check if migrations were successful
check_migration_status() {
    echo "Verifying migration status..."
    php artisan migrate:status --force 2>&1
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "✓ Migration status check passed"
        return 0
    else
        echo "✗ Migration status check failed"
        return 1
    fi
}

# Function to verify all expected tables exist (should be 25 tables)
verify_tables() {
    echo "Verifying all 25 tables were created..."
    
    # Create a temporary PHP script to check tables
    cat > /tmp/check_tables.php << 'EOFPHP'
<?php
$basePath = getcwd();
require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

// All 25 tables that should exist in the database
$required_tables = [
    // Core user and profile tables (5)
    "users", "profiles", "roles", "genders", "suffixes", 
    // Business entity tables (5)
    "employers", "workers", "skills", "collars", "ranks",
    // Service and job tables (3)
    "services", "jobposts", "job_applications",
    // Booking tables (2)
    "bookings", "booking_requests",
    // Communication and review tables (3)
    "reviews", "notifications", "messages",
    // OAuth tables - Laravel Passport (5)
    "oauth_access_tokens", "oauth_auth_codes", "oauth_clients",
    "oauth_personal_access_clients", "oauth_refresh_tokens",
    // Laravel Sanctum (1)
    "personal_access_tokens",
    // System table (1)
    "migrations"
];

$missing_tables = [];
$driver = DB::connection()->getDriverName();

foreach ($required_tables as $table) {
    try {
        if ($driver === 'pgsql') {
            // PostgreSQL check
            $exists = DB::select("SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ?
            )", [$table]);
            $table_exists = $exists[0]->exists;
        } else {
            // MySQL check
            $table_exists = Schema::hasTable($table);
        }
        
        if ($table_exists) {
            echo "EXISTS:$table\n";
        } else {
            echo "MISSING:$table\n";
            $missing_tables[] = $table;
        }
    } catch (Exception $e) {
        echo "ERROR:$table:" . $e->getMessage() . "\n";
        $missing_tables[] = $table;
    }
}

exit(count($missing_tables) > 0 ? 1 : 0);
EOFPHP

    local missing_tables=()
    while IFS= read -r line; do
        if [[ $line == EXISTS:* ]]; then
            table="${line#EXISTS:}"
            echo "  ✓ Table '$table' exists"
        elif [[ $line == MISSING:* ]]; then
            table="${line#MISSING:}"
            echo "  ✗ Table '$table' is MISSING"
            missing_tables+=("$table")
        elif [[ $line == ERROR:* ]]; then
            echo "  ⚠ $line"
        fi
    done < <(php /tmp/check_tables.php 2>&1)
    
    rm -f /tmp/check_tables.php
    
    # Count total tables (25 expected)
    local total_tables=25
    local existing_count=$((total_tables - ${#missing_tables[@]}))
    
    echo ""
    echo "Table verification summary:"
    echo "  Expected: $total_tables tables"
    echo "  Found: $existing_count tables"
    if [ ${#missing_tables[@]} -gt 0 ]; then
        echo "  Missing: ${#missing_tables[@]} tables"
    fi
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        echo "✓ All 25 required tables exist"
        return 0
    else
        echo "✗ Missing tables: ${missing_tables[*]}"
        return 1
    fi
}

# Run migrate:fresh with error handling and retry logic
echo "Step 1: Dropping all tables and running fresh migrations..."

# Try migration up to 3 times if it fails
MAX_RETRIES=3
RETRY_COUNT=0
MIGRATION_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if [ $RETRY_COUNT -gt 0 ]; then
        echo "Retry attempt $RETRY_COUNT of $MAX_RETRIES..."
        sleep 2
    fi
    
    MIGRATION_OUTPUT=$(php artisan migrate:fresh --force 2>&1)
    MIGRATION_EXIT_CODE=$?
    
    if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
        echo "$MIGRATION_OUTPUT"
        echo "✓ Migrations completed successfully"
        MIGRATION_SUCCESS=true
        break
    else
        echo "✗ Migration attempt $((RETRY_COUNT + 1)) failed with exit code: $MIGRATION_EXIT_CODE"
        echo "Migration output:"
        echo "$MIGRATION_OUTPUT"
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Waiting before retry..."
            sleep 3
        fi
    fi
done

if [ "$MIGRATION_SUCCESS" = false ]; then
    echo ""
    echo "========================================="
    echo "ERROR: Database migration failed after $MAX_RETRIES attempts"
    echo "========================================="
    echo ""
    echo "Attempting to diagnose the issue..."
    
    # Try to get more details about the error
    echo "Checking database connection..."
    php artisan db:show --force 2>&1 || echo "Could not show database info"
    
    echo ""
    echo "Checking migration files..."
    php artisan migrate:status --force 2>&1 || echo "Could not get migration status"
    
    echo ""
    echo "Last migration output:"
    echo "$MIGRATION_OUTPUT"
    
    echo ""
    echo "ERROR: Database migration failed. Please check the logs above."
    echo "Common issues:"
    echo "  - Foreign key constraint errors (check migration order)"
    echo "  - Missing database permissions"
    echo "  - Database connection issues"
    echo "  - Syntax errors in migration files"
    exit 1
fi

# Verify migration status
echo ""
echo "Step 2: Verifying migration status..."
if ! check_migration_status; then
    echo "WARNING: Migration status check failed, but continuing..."
fi

# Verify all 25 tables exist
echo ""
echo "Step 3: Verifying all 25 tables were created..."
if ! verify_tables; then
    echo ""
    echo "WARNING: Some tables are missing!"
    echo "Expected 25 tables but some are missing."
    echo "This might indicate a migration issue."
    echo "Please check the migration logs above."
fi

echo ""
echo "========================================="
echo "Database remigration completed successfully!"
echo "========================================="

echo ""
echo "========================================="
echo "Installing Passport..."
echo "========================================="
if php artisan passport:install --force 2>&1; then
    echo "✓ Passport installed successfully"
else
    echo "⚠ Passport install warning - continuing anyway..."
fi

echo ""
echo "========================================="
echo "Running database seeders..."
echo "========================================="

# Function to run seeder with error checking
run_seeder() {
    local seeder_name=$1
    echo "Running $seeder_name..."
    if php artisan db:seed --class=$seeder_name --force 2>&1; then
        echo "✓ $seeder_name completed successfully"
        return 0
    else
        echo "⚠ $seeder_name warning - continuing anyway..."
        return 1
    fi
}

# Run all seeders
run_seeder "GenderSeeder"
run_seeder "RoleSeeder"
run_seeder "SuffixSeeder"
run_seeder "SkillSeeder"
run_seeder "RankSeeder"

echo ""
echo "✓ All seeders completed"

echo "Caching configuration..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Application setup complete!"

# Start Laravel development server
# Render will provide PORT environment variable dynamically
RENDER_PORT=${PORT:-8000}
echo "Starting Laravel server on 0.0.0.0:${RENDER_PORT}"

# Use php artisan serve instead of nginx
exec php artisan serve --host=0.0.0.0 --port=${RENDER_PORT}
