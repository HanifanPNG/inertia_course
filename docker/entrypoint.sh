#!/bin/sh
set -e

# Pastikan folder runtime tersedia.
# JANGAN pernah membuat public/storage di sini: kalau folder itu ada,
# `storage:link` akan menganggap symlink sudah ada lalu menyerah,
# sehingga file upload tidak bisa diakses lewat URL.
mkdir -p storage/app/public \
  storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
  bootstrap/cache

# Volume storage datang dari luar image, jadi kepemilikan file di dalamnya
# bisa saja berubah. www-data di Alpine = uid 82.
chown -R www-data:www-data storage bootstrap/cache

# Buatkan symlink public/storage -> storage/app/public.
# storage:link keluar dengan kode 0 walau symlink sudah ada, tapi tetap
# mencetak "link already exists" di stderr, jadi dicek manual dulu supaya
# log tetap bersih saat container di-restart.
if [ ! -L public/storage ]; then
  php artisan storage:link
fi

# Migrasi otomatis. Aman untuk 1 instance (POS satu toko).
if [ -n "$RUN_MIGRATIONS" ]; then
  echo "[entrypoint] Menjalankan migrasi database..."
  php artisan migrate --force
fi

# Seeding TIDAK dijalankan otomatis di produksi.
# Seeder memakai updateOrCreate, jadi dijalankan tiap boot bisa
# menimpa harga produk yang sudah diedit. Jalankan manual:
#   docker compose run --rm app php artisan db:seed --force
if [ -n "$RUN_SEEDERS" ]; then
  echo "[entrypoint] PERINGATAN: menjalankan seeder (hanya untuk demo/dev)..."
  php artisan db:seed --force
fi

# Optimize untuk production (skip kalau APP_ENV=local)
if [ "$APP_ENV" = "production" ] || [ "$APP_ENV" = "prod" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

# Jalankan command asli (php-fpm)
exec "$@"
