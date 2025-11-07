# Render Deployment Guide for Worqo

This guide will help you deploy your Laravel application to Render.com using Docker.

## Prerequisites

1. A Render.com account (sign up at https://render.com/)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A Render PostgreSQL database (will be created automatically via render.yaml)

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Render dashboard
2. Click "New +" and select "Blueprint"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` file

### 2. Environment Variables

The following environment variables will be set automatically from the `render.yaml` file:

- Database connection variables (from the PostgreSQL database)
- Application settings (APP_NAME, APP_ENV, etc.)

**Important:** You need to manually set the following in Render dashboard:

1. Go to your service settings
2. Navigate to "Environment" tab
3. Add these required variables:

```
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_URL=https://your-app-name.onrender.com
```

To generate APP_KEY, run locally:
```bash
php artisan key:generate --show
```

### 3. Database Setup

The PostgreSQL database will be created automatically via `render.yaml`. After deployment:

1. Go to your database in Render dashboard
2. Copy the connection details
3. Run migrations (via Render Shell or manually):

```bash
php artisan migrate --force
```

### 4. Storage Configuration

For file storage, you have two options:

**Option A: Use Render Persistent Disk (Recommended)**
1. Create a Persistent Disk in Render
2. Mount it to `/var/www/html/storage`
3. Update your service to use the disk

**Option B: Use S3 or similar cloud storage**
1. Configure your filesystem to use S3
2. Update `config/filesystems.php` accordingly

### 5. Build and Deploy

Render will automatically:
1. Build your Docker image
2. Run the entrypoint script
3. Start your application

The entrypoint script will:
- Wait for database connection
- Run migrations
- Cache configuration
- Create storage symlink
- Start PHP-FPM and Nginx

### 6. Post-Deployment

After successful deployment:

1. **Run Seeders (if needed):**
   ```bash
   php artisan db:seed
   ```

2. **Create Storage Link:**
   ```bash
   php artisan storage:link
   ```

3. **Clear Cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

### 7. Monitoring

- Check logs in Render dashboard under "Logs" tab
- Monitor application health
- Set up alerts for deployment failures

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify database credentials in environment variables
2. Check if database is running
3. Ensure database allows connections from your service

### Permission Issues

If you see permission errors:
1. Check storage and bootstrap/cache permissions
2. Ensure files are owned by www-data user

### Build Failures

If build fails:
1. Check Dockerfile syntax
2. Verify all dependencies are available
3. Review build logs in Render dashboard

### Application Not Starting

If application doesn't start:
1. Check supervisor logs
2. Verify PHP-FPM and Nginx are running
3. Check application logs in `storage/logs/`

## Customization

### Changing PHP Version

Edit `Dockerfile` and change:
```dockerfile
FROM php:8.0-fpm-alpine AS base
```
to your desired version (e.g., `php:8.1-fpm-alpine`)

### Adding PHP Extensions

Add to the `docker-php-ext-install` line in Dockerfile:
```dockerfile
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip your-extension
```

### Custom Build Commands

You can add custom build commands in `render.yaml`:
```yaml
buildCommand: "npm install && npm run production"
```

## Support

For issues specific to Render, check:
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com/

For Laravel-specific issues:
- Laravel Documentation: https://laravel.com/docs

