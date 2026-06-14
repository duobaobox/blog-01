#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/dist/app-delivery}"

mkdir -p "$OUTPUT_DIR"

cp "$ROOT_DIR/delivery/release/install.sh" "$OUTPUT_DIR/install.sh"
cp "$ROOT_DIR/delivery/release/README.md" "$OUTPUT_DIR/README.md"
cp "$ROOT_DIR/docker-compose.release.yml" "$OUTPUT_DIR/docker-compose.release.yml"
cp "$ROOT_DIR/.env.release.example" "$OUTPUT_DIR/.env.release.example"

chmod +x "$OUTPUT_DIR/install.sh"

echo "App delivery bundle refreshed:"
echo "  $OUTPUT_DIR"
