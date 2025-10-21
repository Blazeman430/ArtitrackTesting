FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    sqlite3 \
    libsqlite3-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY . .

# Create required directories BEFORE composer install
RUN mkdir -p bootstrap/cache storage/framework/sessions storage/framework/views storage/framework/cache storage/logs
RUN chmod -R 775 bootstrap/cache storage

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set proper ownership
RUN chown -R www-data:www-data /var/www/html

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy Apache configuration
COPY .htaccess /var/www/html/.htaccess

# Cache Laravel configuration
RUN php artisan config:cache
RUN php artisan route:cache

# Expose port 80
EXPOSE 80

# Start Apache on the PORT environment variable (required by Render)
CMD ["sh", "-c", "sed -i 's/80/$PORT/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf && apache2-foreground"]
