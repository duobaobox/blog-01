#!/bin/sh
set -eu

if [ "${1:-}" = "node" ] && [ "${2:-}" = "server.js" ]; then
  /usr/local/bin/schema-sync.sh
fi

exec "$@"
