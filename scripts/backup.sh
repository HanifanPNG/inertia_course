#!/usr/bin/env bash
#
# Backup database MySQL + folder upload (gambar produk).
#
# Pakai:  ./scripts/backup.sh
# Restore: ./scripts/backup.sh restore backups/db-20261010-090000.sql.gz
#
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="backups"
RETENSI_HARI="${RETENSI_HARI:-14}"
COMPOSE=(docker compose)

mkdir -p "$BACKUP_DIR"

# Nama file dengan timestamp, mis. db-20261010-090000.sql.gz
STAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
FILES_DIR="$BACKUP_DIR/files-$STAMP.tar.gz"

log() { printf '\033[0;36m[backup]\033[0m %s\n' "$1"; }
err() { printf '\033[0;31m[backup] ERROR:\033[0m %s\n' "$1" >&2; }

# ---------------------------------------------------------------- restore ----
if [ "${1:-}" = "restore" ]; then
    FILE="${2:-}"
    if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
        err "Cara pakai: ./scripts/backup.sh restore <file-sql-gz>"
        exit 1
    fi

    echo "PERINGATAN: proses ini MENGHAPUS seluruh isi database lalu"
    echo "mengembalikan isinya dari $FILE"
    read -r -p "Ketik 'ya' untuk lanjut: " jawab
    [ "$jawab" = "ya" ] || { err "Dibatalkan."; exit 1; }

    log "Mengembalikan $FILE ke database..."
    # drop & recreate dulu supaya restore tidak bentrok dengan data lama
    "${COMPOSE[@]}" exec -T db sh -c \
        'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "DROP DATABASE IF EXISTS \`$MYSQL_DATABASE\`; CREATE DATABASE \`$MYSQL_DATABASE\`;"'

    gunzip -c "$FILE" | "${COMPOSE[@]}" exec -T db sh -c \
        'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'

    log "Restore selesai."
    exit 0
fi

# ------------------------------------------------------------------ backup ----
command -v docker >/dev/null || { err "docker tidak ditemukan."; exit 1; }

log "Mencadangkan database -> $DB_FILE"
# --single-transaction supaya dump konsisten walau ada yang menulis.
# --no-tablespaces wajib: user MySQL non-root tidak punya privilege PROCESS,
# tanpa flag ini mysqldump gagal (dan diam-diam menghasilkan file rusak).
"${COMPOSE[@]}" exec -T db sh -c \
    'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --no-tablespaces --quick "$MYSQL_DATABASE"' \
    | gzip -9 > "$DB_FILE"

# Cek file hasil dump benar-benar bukan HTML/galat (tanda dump gagal diam-diam)
if [ ! -s "$DB_FILE" ]; then
    err "Dump database kosong. Cek credential & status container db."
    exit 1
fi

log "Mencadangkan file upload -> $FILES_DIR"
# File upload ada di volume storage-data, bukan di folder proyek,
# jadi diambil lewat container app.
"${COMPOSE[@]}" exec -T app tar -czf - -C /var/www/html/storage app/public \
    > "$FILES_DIR"

# --------------------------------------------------------------- retensi ----
log "Menghapus backup yang lebih tua dari $RETENSI_HARI hari..."
find "$BACKUP_DIR" -type f -name '*.sql.gz'    -mtime "+$RETENSI_HARI" -delete
find "$BACKUP_DIR" -type f -name '*.tar.gz'    -mtime "+$RETENSI_HARI" -delete

log "Selesai:"
du -h "$DB_FILE" "$FILES_DIR" | sed 's/^/  /'
echo
log "Urutkan backup:"
ls -1t "$BACKUP_DIR" | head -6 | sed 's/^/  /'