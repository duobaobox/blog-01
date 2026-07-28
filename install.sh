#!/usr/bin/env bash

set -euo pipefail

REPOSITORY="duobaobox/blog-01"
ASSET_NAME="blog-01-linux-amd64.tar.gz"
INSTALL_DIR="${BLOG_INSTALL_DIR:-/opt/blog-01}"
REQUESTED_VERSION="${BLOG_VERSION:-latest}"
REQUESTED_SITE_URL="${SITE_URL:-}"
REQUESTED_APP_PORT="${APP_PORT:-}"

print_header() {
  echo
  echo "==> $1"
}

check_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "This installer writes to $INSTALL_DIR and installs Docker when needed." >&2
    echo "Run it with sudo:" >&2
    echo "  Download blog-01-installer.sh and its .sha256 file from:" >&2
    echo "  https://github.com/$REPOSITORY/releases" >&2
    echo "  Then verify the checksum and run: sudo bash ./blog-01-installer.sh" >&2
    exit 1
  fi
}

check_architecture() {
  local arch
  arch="$(uname -m)"

  case "$arch" in
    x86_64|amd64)
      ;;
    aarch64|arm64)
      echo "Blog-01 currently supports only Linux AMD64 servers." >&2
      exit 1
      ;;
    *)
      echo "Unsupported CPU architecture: $arch" >&2
      exit 1
      ;;
  esac
}

install_base_tools() {
  local missing=0
  for command_name in curl tar sha256sum openssl; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
      missing=1
    fi
  done

  if [[ "$missing" -eq 0 ]]; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl tar coreutils openssl
    return 0
  fi

  if command -v dnf >/dev/null 2>&1; then
    dnf install -y ca-certificates curl tar coreutils openssl
    return 0
  fi

  if command -v yum >/dev/null 2>&1; then
    yum install -y ca-certificates curl tar coreutils openssl
    return 0
  fi

  echo "Install curl, tar, sha256sum, and openssl before continuing." >&2
  exit 1
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return 0
  fi

  print_header "Installing Docker Engine and Docker Compose"
  local installer
  installer="$(mktemp)"
  curl -fsSL https://get.docker.com -o "$installer"
  sh "$installer"
  rm -f "$installer"

  if command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now docker
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose v2 was not installed correctly." >&2
    exit 1
  fi
}

release_download_url() {
  local requested="$1"
  if [[ "$requested" == "latest" ]]; then
    printf 'https://github.com/%s/releases/latest/download/%s\n' "$REPOSITORY" "$ASSET_NAME"
  else
    requested="${requested#v}"
    printf 'https://github.com/%s/releases/download/v%s/%s\n' "$REPOSITORY" "$requested" "$ASSET_NAME"
  fi
}

download_release() {
  local temp_dir="$1"
  local asset_url checksum_url

  asset_url="$(release_download_url "$REQUESTED_VERSION")"
  checksum_url="${asset_url}.sha256"

  print_header "Downloading Blog-01 release"
  echo "$asset_url"

  curl -fL --retry 3 --connect-timeout 15 -o "$temp_dir/$ASSET_NAME" "$asset_url"
  curl -fL --retry 3 --connect-timeout 15 -o "$temp_dir/$ASSET_NAME.sha256" "$checksum_url"

  (
    cd "$temp_dir"
    sha256sum -c "$ASSET_NAME.sha256"
    tar -xzf "$ASSET_NAME"
  )
}

install_bundle() {
  local temp_dir="$1"
  local source_dir="$temp_dir/blog-01-linux-amd64"
  local install_args=(--no-edit)

  if [[ ! -x "$source_dir/install.sh" || ! -f "$source_dir/compose.yaml" ]]; then
    echo "The release bundle is incomplete." >&2
    exit 1
  fi

  mkdir -p "$INSTALL_DIR"
  cp -a "$source_dir/." "$INSTALL_DIR/"
  chmod +x \
    "$INSTALL_DIR/install.sh" \
    "$INSTALL_DIR/blogctl" \
    "$INSTALL_DIR/backup-docker.sh" \
    "$INSTALL_DIR/restore-docker.sh"

  if [[ -n "$REQUESTED_SITE_URL" ]]; then
    install_args+=(--site-url "$REQUESTED_SITE_URL")
  fi

  if [[ -n "$REQUESTED_APP_PORT" ]]; then
    install_args+=(--port "$REQUESTED_APP_PORT")
  fi

  print_header "Installing Blog-01 into $INSTALL_DIR"
  "$INSTALL_DIR/install.sh" "${install_args[@]}"
}

check_root
check_architecture
install_base_tools
install_docker

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

download_release "$TEMP_DIR"
install_bundle "$TEMP_DIR"

print_header "Installation finished"
echo "Installation directory: $INSTALL_DIR"
echo "Manage the service with: $INSTALL_DIR/blogctl"
