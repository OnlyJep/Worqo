# Multi-stage build for Laravel application
# Stage 1: Get Node.js 18 from official Node image
FROM node:18-alpine AS node-builder

# Stage 2: PHP base image
FROM php:8.0-fpm-alpine AS base

# Copy Node.js 18 from node-builder stage
COPY --from=node-builder /usr/local/bin/node /usr/local/bin/node
COPY --from=node-builder /usr/local/bin/npm /usr/local/bin/npm
COPY --from=node-builder /usr/local/lib/node_modules /usr/local/lib/node_modules

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    postgresql-dev \
    nginx \
    supervisor \
    bash

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy package files for better caching
COPY package.json package-lock.json ./

# Install Node dependencies with clean install for consistency
# Suppress peer dependency warnings as they are non-blocking
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy application files
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /var/www/html/public /var/www/html/storage /var/www/html/bootstrap/cache && \
    chown -R root:root /var/www/html && \
    chmod -R 755 /var/www/html/storage && \
    chmod -R 755 /var/www/html/bootstrap/cache && \
    chmod -R 755 /var/www/html/public

# Build assets with error handling
# Set NODE_ENV to production and suppress Sass deprecation warnings
ENV NODE_ENV=production
ENV SASS_SILENCE_DEPRECATIONS=*

# Build assets (warnings are suppressed via webpack config and env vars)
RUN npm run production

# Set final permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/public && \
    chmod -R 755 /var/www/html/storage && \
    chmod -R 755 /var/www/html/bootstrap/cache

# Production stage
FROM base AS production

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/http.d/default.conf

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p /var/log/supervisor /var/run/supervisor

# Expose port
EXPOSE 80

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

