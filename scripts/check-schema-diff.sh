#!/bin/sh
set -eu

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required to diff the live database schema." >&2
  exit 1
fi

echo "Previewing schema changes between DATABASE_URL and prisma/schema.prisma..."

npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma
