#!/usr/bin/env bash
#
# Deploy aplikasi: build image baru -> jalankan -> migrate -> cek health.
# Kalau gagal, otomatis kembali ke image sebelumnya.
#
# Pakai:
#   ./scripts/deploy.sh              # deploy seperti biasa
#   ./scripts/deploy.sh --no-build   # tanpa build (image sudah ada)
#
# CATATAN PENTING untuk produksi:
#   Selalu pakai --no-interaction. Jangan pernah menjalankan migrate
#   yang prompting di server.
#
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE=(docker compose)
BUILD=1
WEB_URL="${WEB_URL:-http://127.0.0.1:8000}"

for arg in "$@"; do
    case "$arg" in
        --no-build) BUILD=0 ;;
        *) echo "Opsi tidak dikenal: $arg"; exit 1 ;;
    esac
done

log()  { printf '\033[0;36m[deploy]\033[0m %s\n' "$1"; }
ok()   { printf '\033[0;32m[deploy] OK:\033[0m %s\n' "$1"; }
err()  { printf '\033[0;31m[deploy] GAGAL:\033[0m %s\n' "$1" >&2; }

# --------------------------------------------- simpan tag image sebelumnya ----
APP_SERVICE=app
# Nama image mengikuti nama folder proyek + service (lihat "docker compose config").
APP_IMAGE="$("${COMPOSE[@]}" config --images | grep -E "${APP_SERVICE}$" | head -1 || true)"
[ -n "$APP_IMAGE" ] || APP_IMAGE="inertia_course-app:latest"

# Simpan tag image yang SEDANG BERJALAN sebagai cadangan rollback.
# Cara ini lebih andal daripada membandingkan ID image, karena tag
# selalu bisa dicari kembali lewat `docker tag`.
BACKUP_TAG="inertia_course-app:rollback-$(date +%Y%m%d%H%M%S)"
if [ -n "$("${COMPOSE[@]}" ps -q "$APP_SERVICE" 2>/dev/null || true)" ]; then
    RUNNING_ID="$("${COMPOSE[@]}" ps -q "$APP_SERVICE" | xargs -r docker inspect --format '{{.Image}}')"
    if [ -n "$RUNNING_ID" ]; then
        docker tag "$RUNNING_ID" "$BACKUP_TAG"
        log "Image dicadangkan sebagai: $BACKUP_TAG"
    fi
fi

rollback() {
    err "Deploy gagal. Mencoba rollback ke image sebelumnya..."

    # Selalu siapkan kembali web service lebih dulu, supaya tidak ada
    # kondisi di mana seluruh stack mati hanya karena satu cek gagal.
    trap - ERR

    if [ -z "${BACKUP_TAG:-}" ]; then
        err "Tidak ada image cadangan. Menyalakan kembali versi terakhir yang diketahui baik."
        "${COMPOSE[@]}" up -d --no-build || {
            err "Gagal menyalakan aplikasi. Cek manual: docker compose ps && docker compose logs"
            exit 1
        }
        exit 1
    fi

    # Kembalikan image standard ke isi tag cadangan, supaya
    # docker-compose.yml (yang memakai nama tag itu) otomatis memakai versi lama.
    docker tag "$BACKUP_TAG" "$APP_IMAGE"

    log "Menjalankan kembali: $APP_IMAGE (dari $BACKUP_TAG)"
    "${COMPOSE[@]}" up -d --force-recreate --no-build || {
        err "Rollback juga gagal. Cek manual."
        exit 1
    }

    ok "Rollback selesai. Aplikasi kembali ke versi sebelumnya."
    exit 1
}

# --------------------------------------------------------------- build ----
if [ "$BUILD" -eq 1 ]; then
    log "Membangun image (bisa memakan waktu beberapa menit)..."
    "${COMPOSE[@]}" build || { err "Build gagal."; exit 1; }
else
    log "Build dilewati (--no-build)."
fi

# ----------------------------------------------------------------- up ----
log "Menjalankan container..."
# --force-recreate memastikan container baru memakai image terbaru.
# Perintah restart saja TIDAK cukup: image lama masih dipakai.
"${COMPOSE[@]}" up -d --force-recreate --no-build || rollback

# ------------------------------------------------------------- migrate ----
# Migrasi sudah otomatis jalan oleh entrypoint (RUN_MIGRATIONS=true).
# Di sini kita hanya memastikan tidak ada migrasi yang gagal.
log "Memastikan migrasi..."
"${COMPOSE[@]}" exec -T app php artisan migrate:status > /dev/null 2>&1 \
    || { err "Aplikasi tidak bisa-boot, likely karena migrasi gagal."; rollback; }

# --------------------------------------------------------------- health ----
log "Menunggu healthcheck (maks 90 detik)..."
SEJAK=$SECONDS
until [ "$("${COMPOSE[@]}" ps --format '{{.Service}} {{.Health}}' | awk '$1=="web" {print $2}')" = "healthy" ]; do
    if [ $(( SECONDS - SEJAK )) -gt 90 ]; then
        err "Container web tidak jadi healthy dalam 90 detik."
        "${COMPOSE[@]}" logs --tail 30 web
        rollback
    fi
    sleep 3
done
ok "Semua container healthy."

# Cek HTTP sungguhan. Healthcheck hanya cek nginx hidup, bukan aplikasinya.
log "Mengecek $WEB_URL ..."
if ! curl -fsS -o /dev/null --max-time 15 "$WEB_URL/login"; then
    err "Halaman /login tidak merespons."
    "${COMPOSE[@]}" logs --tail 30 app
    rollback
fi

ok "Deploy sukses. Buka $WEB_URL"

# ----------------------------------------------------------- housekeeping ----
# Simpan hanya 3 tag rollback terbaru. Tanpa ini, tag menumpuk setiap deploy
# dan memakan disk server.
log "Membersihkan tag rollback lama..."
docker images 'inertia_course-app' --format '{{.Tag}}' \
    | grep '^rollback-' | grep -v "^${BACKUP_TAG##*:}$" \
    | sort -r | tail -n +4 \
    | while read -r tag; do
        docker rmi "inertia_course-app:$tag" > /dev/null 2>&1 || true
      done