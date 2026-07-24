#!/bin/sh
set -eu

BACKUP_ROOT="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DB_CONTAINER="${DB_CONTAINER:-blog-postgres}"
APP_CONTAINER="${APP_CONTAINER:-blog-app}"
POSTGRES_USER="${POSTGRES_USER:-blog}"
POSTGRES_DB="${POSTGRES_DB:-blog}"

case "$BACKUP_ROOT" in
  ""|"/"|".")
    echo "Refusing unsafe backup root: $BACKUP_ROOT" >&2
    exit 1
    ;;
esac

case "$RETENTION_DAYS" in
  *[!0-9]*|"")
    echo "BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
    exit 1
    ;;
esac

umask 077
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET_DIR="$BACKUP_ROOT/$STAMP"
mkdir -p "$TARGET_DIR"

echo "Backing up PostgreSQL to $TARGET_DIR/database.dump"
docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$TARGET_DIR/database.dump"

echo "Backing up media to $TARGET_DIR/media.tar.gz"
docker exec "$APP_CONTAINER" tar -C /app/public/media -czf - . > "$TARGET_DIR/media.tar.gz"

(
  cd "$TARGET_DIR"
  sha256sum database.dump media.tar.gz > SHA256SUMS
)

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -print -exec rm -r -- {} +

echo "Backup complete: $TARGET_DIR"
