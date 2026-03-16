#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <bundle-dir>"
  exit 1
fi

BUNDLE_DIR="$(cd "$1" && pwd)"
CONFIG_DIR="$BUNDLE_DIR/config"

if [[ ! -f "$CONFIG_DIR/docker-compose.yml" ]]; then
  echo "docker-compose.yml not found in $CONFIG_DIR"
  exit 1
fi

if [[ ! -f "$CONFIG_DIR/.env" ]]; then
  echo ".env not found in $CONFIG_DIR"
  exit 1
fi

echo "[1/3] Starting app + db"
docker compose -f "$CONFIG_DIR/docker-compose.yml" --env-file "$CONFIG_DIR/.env" up -d

echo "[2/3] Running migrate"
docker compose -f "$CONFIG_DIR/docker-compose.yml" --env-file "$CONFIG_DIR/.env" run --rm --profile tools migrate

echo "[3/3] If this is first deploy, run seed:"
echo "docker compose -f \"$CONFIG_DIR/docker-compose.yml\" --env-file \"$CONFIG_DIR/.env\" run --rm --profile tools seed"
