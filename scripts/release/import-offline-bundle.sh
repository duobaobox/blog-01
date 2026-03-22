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

echo "[2/3] Verifying compose file"
if [[ ! -f "$CONFIG_DIR/docker-compose.yml" ]]; then
  echo "docker-compose.yml not found: $CONFIG_DIR/docker-compose.yml"
  exit 1
fi

echo "[3/3] Done"
echo "Next:"
echo "  cd $CONFIG_DIR"
echo "  vim docker-compose.yml"
echo "  # edit only the install-config block at the top"
echo "  bash ../scripts/start-offline-stack.sh $BUNDLE_DIR"
