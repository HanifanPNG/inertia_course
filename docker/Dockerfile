FROM php:8.3-cli-alpine AS build

RUN apk add --no-cache nodejs npm unzip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-progress --no-interaction --prefer-dist
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

# Laravel butuh folder-folder ini saat boot (cache, session, view, log).
# Kita sengaja tidak membawanya dari host, jadi image membuatnya sendiri dulu.
RUN mkdir -p storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs

RUN npm run build && test -f public/build/manifest.json

FROM php:8.3-fpm-alpine AS runtime

# Base image sudah membawa: mbstring, xml, dom, xmlwriter, opcache, pdo_sqlite.
# Jadi kita hanya memasang yang benar-benar kurang.
RUN apk add --no-cache \
        git curl unzip \
        icu-libs libzip libpng libjpeg-turbo freetype libwebp oniguruma \
    && apk add --no-cache --virtual .build-deps \
        oniguruma-dev libzip-dev icu-dev \
        libpng-dev libjpeg-turbo-dev freetype-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install \
        pdo_mysql bcmath zip intl exif pcntl gd \
    && apk del --no-network .build-deps \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .
COPY --from=build /app/vendor ./vendor
COPY --from=build /app/public/build ./public/build

# Buat folder runtime DULU, baru dump-autoload (yang memicu artisan package:discover).
RUN mkdir -p storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs \
    && composer dump-autoload --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

# === WEB STAGE (nginx) ===
FROM nginx:1.27-alpine AS web

WORKDIR /var/www/html

# Salin config nginx
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Salin file statis (public/) hasil build
COPY --from=build /app/public ./public

# Container nginx tidak menjalankan entrypoint app, jadi symlink storage
# harus dibuat di sini. Targetnya /var/www/html/storage/app/public yang
# nanti diisi oleh volume storage-data.
RUN ln -s ../storage/app/public public/storage

EXPOSE 80