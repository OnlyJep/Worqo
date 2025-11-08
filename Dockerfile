FROM php:8.0-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    libzip-dev \
    libpq-dev \
    openssl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (PostgreSQL support included, OpenSSL is built-in)
RUN docker-php-ext-install pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd zip opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for better caching)
COPY composer.json composer.lock* ./

# Install PHP dependencies (skip scripts - run them later after copying app)
RUN if [ -f composer.lock ]; then composer update lcobucci/jwt --no-dev --no-interaction --prefer-dist --no-scripts --with-dependencies || true; fi && \
    composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts || \
    (echo "Composer install failed, trying with --ignore-platform-reqs" && \
     composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --ignore-platform-reqs --no-scripts)

# Copy package files
COPY package.json package-lock.json* ./

# Install Node dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy rest of application files
COPY . .

# Create storage and public directories first and set permissions for build
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache public && \
    chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public

# Run composer post-install scripts now that artisan is available
RUN composer dump-autoload --optimize --no-interaction || true && \
    php artisan package:discover --ansi || true

# Build assets (run as root during build, then fix permissions)
ENV NODE_ENV=production
ENV SASS_SILENCE_DEPRECATIONS=*
RUN npm run production || echo "Asset build failed, continuing..."

# Set final permissions for runtime
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 755 /var/www/html/public

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port (Render uses dynamic PORT)
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
