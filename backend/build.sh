#!/bin/bash

# Render build script for Laravel backend
set -e

echo "Starting Laravel build process..."

# Install dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# Create required directories
mkdir -p bootstrap/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/framework/cache
mkdir -p storage/logs

# Set permissions
chmod -R 775 bootstrap/cache storage

# Cache configuration
php artisan config:cache
php artisan route:cache

echo "Build completed successfully!"
