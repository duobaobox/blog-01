#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="${1:-}"
DIST_DIR="${DIST_DIR:-$ROOT_DIR/dist}"
RELEASE_DIR="$DIST_DIR/blog-01-linux-amd64"
ASSET_NAME="blog-01-linux-amd64.tar.gz"
ASSET_PATH="$DIST_DIR/$ASSET_NAME"

if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
fi

VERSION="${VERSION#v}"

if ! printf '%s' "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$'; then
  echo "Invalid release version: $VERSION" >&2
  exit 1
fi

rm -rf "$RELEASE_DIR" "$ASSET_PATH" "$ASSET_PATH.sha256"
mkdir -p "$RELEASE_DIR"

cp "$ROOT_DIR/docker-compose.release.yml" "$RELEASE_DIR/compose.yaml"
cp "$ROOT_DIR/.env.release.example" "$RELEASE_DIR/.env.example"
cp "$ROOT_DIR/delivery/release/install.sh" "$RELEASE_DIR/install.sh"
cp "$ROOT_DIR/delivery/release/blogctl" "$RELEASE_DIR/blogctl"
cp "$ROOT_DIR/delivery/release/README.md" "$RELEASE_DIR/README.md"
cp "$ROOT_DIR/scripts/backup-docker.sh" "$RELEASE_DIR/backup-docker.sh"
cp "$ROOT_DIR/scripts/restore-docker.sh" "$RELEASE_DIR/restore-docker.sh"
printf '%s\n' "$VERSION" > "$RELEASE_DIR/VERSION"

chmod +x \
  "$RELEASE_DIR/install.sh" \
  "$RELEASE_DIR/blogctl" \
  "$RELEASE_DIR/backup-docker.sh" \
  "$RELEASE_DIR/restore-docker.sh"

tar -C "$DIST_DIR" -czf "$ASSET_PATH" blog-01-linux-amd64
(
  cd "$DIST_DIR"
  sha256sum "$ASSET_NAME" > "$ASSET_NAME.sha256"
)

echo "Release bundle created:"
echo "  $ASSET_PATH"
echo "  $ASSET_PATH.sha256"
