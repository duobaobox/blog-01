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

if grep -Eq "your-server-ip|replace-with-strong|change-this" "$CONFIG_DIR/docker-compose.yml"; then
  echo "Please edit $CONFIG_DIR/docker-compose.yml first."
  echo "Only change the install-config block at the top, then rerun this script."
  exit 1
fi

mkdir -p "$CONFIG_DIR/media" "$CONFIG_DIR/data/postgres"

echo "[1/3] Starting db"
docker compose -f "$CONFIG_DIR/docker-compose.yml" up -d db

echo "[2/3] Running migrate"
docker compose -f "$CONFIG_DIR/docker-compose.yml" run --rm --profile tools migrate

echo "[3/3] Starting app"
docker compose -f "$CONFIG_DIR/docker-compose.yml" up -d app

echo "Done"
echo "Open:"
echo "  http://your-server-ip:3000/admin/login"
