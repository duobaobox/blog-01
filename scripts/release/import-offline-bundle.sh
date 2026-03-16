#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <bundle-dir>"
  exit 1
fi

BUNDLE_DIR="$(cd "$1" && pwd)"
IMAGES_DIR="$BUNDLE_DIR/images"
CONFIG_DIR="$BUNDLE_DIR/config"

if [[ ! -d "$IMAGES_DIR" ]]; then
  echo "images directory not found: $IMAGES_DIR"
  exit 1
fi

echo "[1/3] Loading docker images"
for image_tar in "$IMAGES_DIR"/*.tar; do
  docker load -i "$image_tar"
done

echo "[2/3] Preparing environment file"
if [[ ! -f "$CONFIG_DIR/.env" ]]; then
  cp "$CONFIG_DIR/.env.example" "$CONFIG_DIR/.env"
  echo "Created $CONFIG_DIR/.env from template. Please edit it before starting services."
fi

echo "[3/3] Done"
echo "Next:"
echo "  cd $CONFIG_DIR"
echo "  vim .env"
echo "  bash ../scripts/start-offline-stack.sh $BUNDLE_DIR"
