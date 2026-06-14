#!/bin/sh
set -eu

if [ "${1:-}" = "node" ] && [ "${2:-}" = "server.js" ] && [ "${RUN_DB_PUSH:-1}" = "1" ]; then
  echo "Running Prisma schema sync..."
  /app/node_modules/.bin/prisma db push --schema /app/prisma/schema.prisma
fi

exec "$@"
