#!/bin/sh
set -eu

BACKUP_ROOT="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DB_CONTAINER="${DB_CONTAINER:-blog-postgres}"
APP_CONTAINER="${APP_CONTAINER:-blog-app}"
POSTGRES_USER="${POSTGRES_USER:-blog}"
POSTGRES_DB="${POSTGRES_DB:-blog}"
BACKUP_MARKER=".blog-01-backup"

case "$BACKUP_ROOT" in
  ""|"/"|"."|"./")
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

is_backup_snapshot_name() {
  case "$1" in
    [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]T[0-9][0-9][0-9][0-9][0-9][0-9]Z)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

prune_expired_backups() {
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -print |
    while IFS= read -r candidate; do
      snapshot_name="${candidate##*/}"

      if ! is_backup_snapshot_name "$snapshot_name"; then
        echo "Skipping non-backup directory during retention cleanup: $candidate" >&2
        continue
      fi

      if [ ! -f "$candidate/$BACKUP_MARKER" ]; then
        echo "Skipping unmarked directory during retention cleanup: $candidate" >&2
        continue
      fi

      echo "Removing expired backup: $candidate"
      rm -r -- "$candidate"
    done
}

mkdir -p "$BACKUP_ROOT"

if [ "${BACKUP_RETENTION_ONLY:-0}" = "1" ]; then
  prune_expired_backups
  exit 0
fi

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
  : > "$BACKUP_MARKER"
)

prune_expired_backups

echo "Backup complete: $TARGET_DIR"
