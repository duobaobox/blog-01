#!/bin/sh
set -eu

BACKUP_DIR="${1:-}"
DB_CONTAINER="${DB_CONTAINER:-blog-postgres}"
APP_CONTAINER="${APP_CONTAINER:-blog-app}"
POSTGRES_USER="${POSTGRES_USER:-blog}"
POSTGRES_DB="${POSTGRES_DB:-blog}"

if [ "${CONFIRM_RESTORE:-}" != "1" ]; then
  echo "Restore overwrites the current database and media. Re-run with CONFIRM_RESTORE=1." >&2
  exit 1
fi

if [ -z "$BACKUP_DIR" ] || [ ! -f "$BACKUP_DIR/database.dump" ] || [ ! -f "$BACKUP_DIR/media.tar.gz" ]; then
  echo "Usage: CONFIRM_RESTORE=1 $0 <backup-directory>" >&2
  exit 1
fi

if [ -f "$BACKUP_DIR/SHA256SUMS" ]; then
  (cd "$BACKUP_DIR" && sha256sum -c SHA256SUMS)
fi

APP_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$APP_CONTAINER")"
APP_WAS_RUNNING="$(docker inspect --format '{{.State.Running}}' "$APP_CONTAINER")"

restart_app() {
  if [ "$APP_WAS_RUNNING" = "true" ]; then
    docker start "$APP_CONTAINER" >/dev/null
  fi
}
trap restart_app EXIT INT TERM

if [ "$APP_WAS_RUNNING" = "true" ]; then
  docker stop "$APP_CONTAINER" >/dev/null
fi

echo "Restoring PostgreSQL from $BACKUP_DIR/database.dump"
docker exec -i "$DB_CONTAINER" pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$BACKUP_DIR/database.dump"

echo "Restoring media from $BACKUP_DIR/media.tar.gz"
docker run --rm --volumes-from "$APP_CONTAINER" -i --entrypoint sh "$APP_IMAGE" -c 'find /app/public/media -mindepth 1 -delete && tar -xzf - -C /app/public/media' < "$BACKUP_DIR/media.tar.gz"

trap - EXIT INT TERM
restart_app
echo "Restore complete."
