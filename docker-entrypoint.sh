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

php artisan storage:link || true

echo "Running migrations..."
php artisan migrate --force || echo "Migration warning - continuing anyway..."

echo "Installing Passport..."
php artisan passport:install --force || echo "Passport install warning - continuing anyway..."

echo "Running database seeders..."
php artisan db:seed --class=GenderSeeder --force || echo "GenderSeeder warning..."
php artisan db:seed --class=RoleSeeder --force || echo "RoleSeeder warning..."
php artisan db:seed --class=SuffixSeeder --force || echo "SuffixSeeder warning..."
php artisan db:seed --class=SkillSeeder --force || echo "SkillSeeder warning..."
php artisan db:seed --class=RankSeeder --force || echo "RankSeeder warning..."
php artisan db:seed --class=UserSeeder --force || echo "UserSeeder warning..."

echo "Caching configuration..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Application setup complete!"

# Update nginx config with Render's PORT if set (Render uses PORT env variable)
# Render requires listening on 0.0.0.0 (all interfaces) on the PORT env variable
# Render will provide PORT environment variable dynamically
RENDER_PORT=${PORT:-8000}
echo "Configuring nginx to listen on 0.0.0.0:${RENDER_PORT}"

# Update nginx configuration to listen on the correct port and interface
sed -i "s/listen .*;/listen 0.0.0.0:${RENDER_PORT};/" /etc/nginx/sites-available/default
# Also update the symlinked file if it exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    sed -i "s/listen .*;/listen 0.0.0.0:${RENDER_PORT};/" /etc/nginx/sites-enabled/default
fi

# Ensure nginx is configured and will start (but don't fail if port scan happens before nginx starts)
# Render will detect the port once nginx starts serving
nginx -t || echo "Nginx config test failed, but continuing..."

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
