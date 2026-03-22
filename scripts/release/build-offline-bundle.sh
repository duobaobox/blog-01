#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_ROOT="${OUTPUT_ROOT:-$ROOT_DIR/dist/offline-delivery}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"
PLATFORM="${PLATFORM:-linux/amd64}"
APP_IMAGE_REPO="${APP_IMAGE_REPO:-blog-01-app}"
APP_IMAGE_TAG="${APP_IMAGE_TAG:-$VERSION}"
APP_IMAGE="$APP_IMAGE_REPO:$APP_IMAGE_TAG"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:16}"
BUNDLE_DIR="$OUTPUT_ROOT/blog-01-offline-$VERSION"
IMAGES_DIR="$BUNDLE_DIR/images"
CONFIG_DIR="$BUNDLE_DIR/config"
DOCS_DIR="$BUNDLE_DIR/docs"
SCRIPTS_DIR="$BUNDLE_DIR/scripts"

mkdir -p "$IMAGES_DIR" "$CONFIG_DIR" "$DOCS_DIR" "$SCRIPTS_DIR"

echo "[1/6] Building app image: $APP_IMAGE ($PLATFORM)"
docker buildx build --platform "$PLATFORM" --load -t "$APP_IMAGE" "$ROOT_DIR"

echo "[2/6] Pulling database image: $POSTGRES_IMAGE ($PLATFORM)"
docker pull --platform "$PLATFORM" "$POSTGRES_IMAGE"

echo "[3/6] Saving docker images"
docker save -o "$IMAGES_DIR/${APP_IMAGE_REPO//\//_}-${APP_IMAGE_TAG}.tar" "$APP_IMAGE"
docker save -o "$IMAGES_DIR/${POSTGRES_IMAGE//[:\/]/_}.tar" "$POSTGRES_IMAGE"

echo "[4/6] Copying delivery files"
sed \
  -e "s|__APP_IMAGE__|$APP_IMAGE|g" \
  -e "s|__POSTGRES_IMAGE__|$POSTGRES_IMAGE|g" \
  "$ROOT_DIR/delivery/offline/docker-compose.offline.yml" \
  > "$CONFIG_DIR/docker-compose.yml"
cp "$ROOT_DIR/docs/offline-image-delivery-guide.md" "$DOCS_DIR/"
cp "$ROOT_DIR/scripts/release/import-offline-bundle.sh" "$SCRIPTS_DIR/"
cp "$ROOT_DIR/scripts/release/start-offline-stack.sh" "$SCRIPTS_DIR/"
cat > "$BUNDLE_DIR/QUICKSTART.txt" <<EOF
1. Upload this bundle directory or archive to your server and extract it.
2. Run: bash scripts/import-offline-bundle.sh .
3. Edit: config/docker-compose.yml
   Only change the install-config block at the top.
4. Run: bash scripts/start-offline-stack.sh .
5. Open: http://your-server-ip:3000/admin/login
EOF

echo "[5/6] Writing manifest"
cat > "$BUNDLE_DIR/manifest.txt" <<EOF
bundle_version=$VERSION
platform=$PLATFORM
app_image=$APP_IMAGE
postgres_image=$POSTGRES_IMAGE
generated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

(cd "$BUNDLE_DIR" && shasum -a 256 images/*.tar > SHA256SUMS)

echo "[6/6] Packing archive"
tar -C "$OUTPUT_ROOT" -czf "$OUTPUT_ROOT/blog-01-offline-$VERSION.tar.gz" "blog-01-offline-$VERSION"

echo
echo "Offline bundle ready:"
echo "  directory: $BUNDLE_DIR"
echo "  archive:   $OUTPUT_ROOT/blog-01-offline-$VERSION.tar.gz"
echo "  app image: $APP_IMAGE"
