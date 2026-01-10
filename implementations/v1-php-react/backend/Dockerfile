# Stage 1: Build Frontend
FROM node:20 as frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Build Backend
FROM php:8.2-apache

# Install dependencies
RUN apt-get update && apt-get install -y libpq-dev zip unzip git \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite \
    && sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/composer.json .
RUN composer install --no-dev --optimize-autoloader

COPY backend .

# Copy Frontend Build
# We copy to a separate directory to avoid being hidden by the volume mount of /var/www/html
COPY --from=frontend-builder /app/dist /var/www/frontend

# Adjust permissions
RUN chown -R www-data:www-data /var/www/html /var/www/frontend
