#!/bin/sh
set -eu

SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-/app/prisma/schema.prisma}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"

find_prisma_bin() {
  if [ -x "/app/node_modules/.bin/prisma" ]; then
    printf '%s' "/app/node_modules/.bin/prisma"
    return 0
  fi

  if [ -x "./node_modules/.bin/prisma" ]; then
    printf '%s' "./node_modules/.bin/prisma"
    return 0
  fi

  command -v prisma
}

find_schema_sync_resolver() {
  if [ -f "/app/scripts/resolve-schema-sync-mode.mjs" ]; then
    printf '%s' "/app/scripts/resolve-schema-sync-mode.mjs"
    return 0
  fi

  if [ -f "/usr/local/bin/resolve-schema-sync-mode.mjs" ]; then
    printf '%s' "/usr/local/bin/resolve-schema-sync-mode.mjs"
    return 0
  fi

  if [ -f "$SCRIPT_DIR/resolve-schema-sync-mode.mjs" ]; then
    printf '%s' "$SCRIPT_DIR/resolve-schema-sync-mode.mjs"
    return 0
  fi

  echo "resolve-schema-sync-mode.mjs not found." >&2
  exit 1
}

has_legacy_run_db_push() {
  [ -n "${RUN_DB_PUSH+x}" ]
}

resolve_requested_schema_sync_mode() {
  if [ -n "${DB_SCHEMA_SYNC_MODE:-}" ] && [ "${DB_SCHEMA_SYNC_MODE}" != "auto" ]; then
    printf '%s' "$DB_SCHEMA_SYNC_MODE"
    return 0
  fi

  if has_legacy_run_db_push && [ "${RUN_DB_PUSH}" = "1" ]; then
    printf 'push'
    return 0
  fi

  if [ -n "${DB_SCHEMA_SYNC_MODE:-}" ] && [ "${DB_SCHEMA_SYNC_MODE}" = "auto" ]; then
    printf 'auto'
    return 0
  fi

  if [ -n "${DATABASE_URL:-}" ]; then
    printf 'auto'
    return 0
  fi

  printf 'skip'
}

print_schema_sync_mode_help() {
  cat <<'EOF'
Usage: schema-sync.sh [--print-mode]

Without arguments, resolves DB schema sync mode and runs the matching Prisma command.

Options:
  --print-mode  Print the resolved schema sync mode and exit.
  --help        Show this help text.

Modes:
  auto     Inspect database state and choose migrate or push automatically.
  push     Run prisma db push.
  migrate  Run prisma migrate deploy.
  skip     Skip schema sync completely.
EOF
}

describe_schema_sync_source() {
  if [ -n "${DB_SCHEMA_SYNC_MODE:-}" ] && [ "${DB_SCHEMA_SYNC_MODE}" != "auto" ]; then
    printf '%s' "DB_SCHEMA_SYNC_MODE"
    return 0
  fi

  if has_legacy_run_db_push && [ "${RUN_DB_PUSH}" = "1" ]; then
    printf '%s' "RUN_DB_PUSH"
    return 0
  fi

  if [ -n "${DB_SCHEMA_SYNC_MODE:-}" ] && [ "${DB_SCHEMA_SYNC_MODE}" = "auto" ]; then
    printf '%s' "DB_SCHEMA_SYNC_MODE(auto)"
    return 0
  fi

  if [ -n "${DATABASE_URL:-}" ]; then
    printf '%s' "auto"
    return 0
  fi

  printf '%s' "default"
}

AUTO_SCHEMA_SYNC_DETAILS=""

resolve_auto_schema_sync_details() {
  if [ -n "${AUTO_SCHEMA_SYNC_DETAILS:-}" ]; then
    printf '%s\n' "$AUTO_SCHEMA_SYNC_DETAILS"
    return 0
  fi

  resolver="$(find_schema_sync_resolver)"
  AUTO_SCHEMA_SYNC_DETAILS="$(node "$resolver" --details)"
  printf '%s\n' "$AUTO_SCHEMA_SYNC_DETAILS"
}

resolve_schema_sync_mode() {
  requested_mode="$(resolve_requested_schema_sync_mode)"

  if [ "$requested_mode" != "auto" ]; then
    printf '%s' "$requested_mode"
    return 0
  fi

  details="$(resolve_auto_schema_sync_details)"
  printf '%s\n' "$details" | awk -F= '$1 == "mode" { print substr($0, index($0, "=") + 1); exit }'
}

print_auto_schema_sync_details() {
  details="$(resolve_auto_schema_sync_details)"

  printf '%s\n' "$details" | while IFS='=' read -r key value; do
    case "$key" in
      mode)
        ;;
      environment_kind)
        echo "  environment kind: $value"
        ;;
      rationale)
        echo "  rationale: $value"
        ;;
    esac
  done
}

print_schema_sync_resolution() {
  mode="$1"
  source="$2"

  echo "Resolved DB schema sync mode: $mode"
  echo "  source: $source"

  if [ "$source" = "RUN_DB_PUSH" ]; then
    echo "  note: RUN_DB_PUSH is deprecated; prefer DB_SCHEMA_SYNC_MODE." >&2
  fi

  if [ "$source" = "DB_SCHEMA_SYNC_MODE(auto)" ] || [ "$source" = "auto" ]; then
    print_auto_schema_sync_details
  fi
}

run_schema_sync() {
  mode="$(resolve_schema_sync_mode)"
  source="$(describe_schema_sync_source)"
  print_schema_sync_resolution "$mode" "$source"
  prisma_bin="$(find_prisma_bin)"

  case "$mode" in
    push)
      echo "Running Prisma schema sync with db push..."
      "$prisma_bin" db push --schema "$SCHEMA_PATH"
      ;;
    migrate)
      echo "Running Prisma schema sync with migrate deploy..."
      "$prisma_bin" migrate deploy --schema "$SCHEMA_PATH"
      ;;
    skip)
      echo "Skipping Prisma schema sync."
      ;;
    *)
      echo "Unsupported DB_SCHEMA_SYNC_MODE: $mode" >&2
      exit 1
      ;;
  esac
}

main() {
  case "${1:-}" in
    --help)
      print_schema_sync_mode_help
      ;;
    --print-mode)
      mode="$(resolve_schema_sync_mode)"
      source="$(describe_schema_sync_source)"
      print_schema_sync_resolution "$mode" "$source"
      ;;
    "")
      run_schema_sync
      ;;
    *)
      echo "Unsupported arg: $1" >&2
      exit 1
      ;;
  esac
}

main "${1:-}"
