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

echo "Running migrations..."
# Run all migrations first
php artisan migrate --force

# Check migration status
MIGRATION_STATUS=$?

# Always ensure critical migrations are run, even if main migration had errors
echo "Ensuring critical column migrations are applied..."

# Run last_activity migration if it hasn't been run yet
echo "Checking/adding last_activity column..."
php artisan migrate --path=database/migrations/2025_10_17_040000_add_last_activity_to_users_table.php --force 2>&1 | grep -v "Nothing to migrate" || echo "Last activity column already exists or migration completed"

# Run is_online migration if it hasn't been run yet (must run after last_activity)
echo "Checking/adding is_online column..."
php artisan migrate --path=database/migrations/2025_10_24_034522_add_is_online_to_users_table.php --force 2>&1 | grep -v "Nothing to migrate" || echo "Is online column already exists or migration completed"

# Verify migrations were successful
echo "Verifying database schema..."
php artisan tinker --execute="
try {
    \$hasLastActivity = Schema::hasColumn('users', 'last_activity');
    \$hasIsOnline = Schema::hasColumn('users', 'is_online');
    echo 'Database schema check: ';
    echo 'last_activity: ' . (\$hasLastActivity ? 'EXISTS' : 'MISSING') . ', ';
    echo 'is_online: ' . (\$hasIsOnline ? 'EXISTS' : 'MISSING') . PHP_EOL;
} catch (Exception \$e) {
    echo 'Schema check error: ' . \$e->getMessage() . PHP_EOL;
}
" 2>/dev/null || echo "Schema verification skipped (tinker may not be available)"

echo "Installing Passport..."
php artisan passport:install --force || echo "Passport install warning - continuing anyway..."

echo "Running database seeders..."
php artisan db:seed --class=GenderSeeder --force || echo "GenderSeeder warning..."
php artisan db:seed --class=RoleSeeder --force || echo "RoleSeeder warning..."
php artisan db:seed --class=SuffixSeeder --force || echo "SuffixSeeder warning..."
php artisan db:seed --class=SkillSeeder --force || echo "SkillSeeder warning..."
php artisan db:seed --class=RankSeeder --force || echo "RankSeeder warning..."

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
