#!/bin/sh
set -eu

TEST_ROOT="$(mktemp -d)"
cleanup() {
  rm -r -- "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

VALID_BACKUP="$TEST_ROOT/20260101T000000Z"
UNMARKED_BACKUP="$TEST_ROOT/20260102T000000Z"
ORDINARY_DIRECTORY="$TEST_ROOT/project-assets"

mkdir -p "$VALID_BACKUP" "$UNMARKED_BACKUP" "$ORDINARY_DIRECTORY"
: > "$VALID_BACKUP/.blog-01-backup"

touch -t 200001010000 "$VALID_BACKUP" "$UNMARKED_BACKUP" "$ORDINARY_DIRECTORY"

BACKUP_RETENTION_ONLY=1 BACKUP_RETENTION_DAYS=0   sh scripts/backup-docker.sh "$TEST_ROOT"

if [ -d "$VALID_BACKUP" ]; then
  echo "Expected marked timestamp backup to be removed." >&2
  exit 1
fi

if [ ! -d "$UNMARKED_BACKUP" ]; then
  echo "Unmarked timestamp directory must be preserved." >&2
  exit 1
fi

if [ ! -d "$ORDINARY_DIRECTORY" ]; then
  echo "Ordinary directory must be preserved." >&2
  exit 1
fi

echo "Backup retention safety test passed."
