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
php artisan key:generate --ansi || true
php artisan storage:link || true
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

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
if [ -n "$PORT" ]; then
    echo "Updating nginx to listen on port $PORT"
    sed -i "s/listen [0-9]*;/listen ${PORT};/" /etc/nginx/sites-available/default
    # Also update the symlinked file
    sed -i "s/listen [0-9]*;/listen ${PORT};/" /etc/nginx/sites-enabled/default
    # Test nginx configuration
    nginx -t || echo "Nginx config test failed, but continuing..."
fi

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
