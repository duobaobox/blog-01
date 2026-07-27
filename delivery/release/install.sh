#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE_DIR="$SCRIPT_DIR"
EDIT_MODE="auto"
REQUESTED_SITE_URL="${SITE_URL:-}"
REQUESTED_APP_PORT="${APP_PORT:-}"

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Options:
  --edit              Open .env.release before starting containers.
  --no-edit           Do not open an editor.
  --site-url URL      Set the public site URL, for example https://blog.example.com.
  --port PORT         Set the host port used when no reverse proxy is configured.
  -h, --help          Show this help message.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --edit)
      EDIT_MODE="edit"
      shift
      ;;
    --no-edit)
      EDIT_MODE="no-edit"
      shift
      ;;
    --site-url)
      [[ $# -ge 2 ]] || { echo "--site-url requires a value." >&2; exit 1; }
      REQUESTED_SITE_URL="$2"
      shift 2
      ;;
    --port)
      [[ $# -ge 2 ]] || { echo "--port requires a value." >&2; exit 1; }
      REQUESTED_APP_PORT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

COMPOSE_FILE="$BUNDLE_DIR/compose.yaml"
ENV_TEMPLATE="$BUNDLE_DIR/.env.example"
ENV_FILE="$BUNDLE_DIR/.env.release"
VERSION_FILE="$BUNDLE_DIR/VERSION"
BLOGCTL="$BUNDLE_DIR/blogctl"
CREATED_ENV_FILE=0

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_TEMPLATE" ]]; then
  echo "Environment template not found: $ENV_TEMPLATE" >&2
  exit 1
fi

check_architecture() {
  local arch
  arch="$(uname -m)"

  case "$arch" in
    x86_64|amd64)
      ;;
    aarch64|arm64)
      echo "Blog-01 currently publishes only linux/amd64 images." >&2
      echo "ARM64 support may be added in a future release." >&2
      exit 1
      ;;
    *)
      echo "Unsupported CPU architecture: $arch" >&2
      exit 1
      ;;
  esac
}

require_runtime() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required. Run the repository root install.sh or install Docker first." >&2
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose v2 is required." >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Cannot access the Docker daemon. Run as root or grant this user Docker access." >&2
    exit 1
  fi
}

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
    printf '\n'
  fi
}

read_env_value() {
  local key="$1"
  local file="$2"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, "", $0); print $0; exit }' "$file"
}

set_env_value() {
  local key="$1"
  local value="$2"
  local file="$3"
  local escaped

  escaped="${value//\\/\\\\}"
  escaped="${escaped//&/\\&}"
  escaped="${escaped//#/\\#}"

  if grep -q "^${key}=" "$file"; then
    sed -i "s#^${key}=.*#${key}=${escaped}#" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

validate_port() {
  local port="$1"
  if ! [[ "$port" =~ ^[0-9]+$ ]] || (( port < 1 || port > 65535 )); then
    echo "Invalid port: $port" >&2
    exit 1
  fi
}

detect_server_ip() {
  local detected_ip=""

  if command -v curl >/dev/null 2>&1; then
    detected_ip="$(curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  fi

  if [[ -z "$detected_ip" ]] && command -v hostname >/dev/null 2>&1; then
    detected_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi

  if [[ -z "$detected_ip" ]] && command -v ip >/dev/null 2>&1; then
    detected_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ { for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
  fi

  printf '%s\n' "${detected_ip:-127.0.0.1}"
}

release_version() {
  if [[ -f "$VERSION_FILE" ]]; then
    tr -d '[:space:]' < "$VERSION_FILE"
  else
    printf '%s\n' "latest"
  fi
}

prepare_env_file() {
  local app_port site_url version

  cp "$ENV_TEMPLATE" "$ENV_FILE"
  CREATED_ENV_FILE=1

  app_port="${REQUESTED_APP_PORT:-$(read_env_value APP_PORT "$ENV_TEMPLATE")}"
  app_port="${app_port:-3000}"
  validate_port "$app_port"

  if [[ -n "$REQUESTED_SITE_URL" ]]; then
    site_url="${REQUESTED_SITE_URL%/}"
  else
    site_url="http://$(detect_server_ip):${app_port}"
  fi

  version="$(release_version)"

  set_env_value APP_IMAGE "ghcr.io/duobaobox/blog-01" "$ENV_FILE"
  set_env_value BLOG_VERSION "$version" "$ENV_FILE"
  set_env_value APP_PORT "$app_port" "$ENV_FILE"
  set_env_value POSTGRES_PASSWORD "$(generate_secret)" "$ENV_FILE"
  set_env_value BETTER_AUTH_SECRET "$(generate_secret)" "$ENV_FILE"
  set_env_value ADMIN_SETUP_TOKEN "$(generate_secret | cut -c1-32)" "$ENV_FILE"
  set_env_value BETTER_AUTH_URL "$site_url" "$ENV_FILE"
  set_env_value BETTER_AUTH_TRUSTED_ORIGINS "$site_url" "$ENV_FILE"
  set_env_value SITE_URL "$site_url" "$ENV_FILE"

  chmod 600 "$ENV_FILE"
}

refresh_release_values() {
  local version
  version="$(release_version)"

  set_env_value APP_IMAGE "ghcr.io/duobaobox/blog-01" "$ENV_FILE"
  set_env_value BLOG_VERSION "$version" "$ENV_FILE"

  if [[ -n "$REQUESTED_APP_PORT" ]]; then
    validate_port "$REQUESTED_APP_PORT"
    set_env_value APP_PORT "$REQUESTED_APP_PORT" "$ENV_FILE"
  fi

  if [[ -n "$REQUESTED_SITE_URL" ]]; then
    REQUESTED_SITE_URL="${REQUESTED_SITE_URL%/}"
    set_env_value BETTER_AUTH_URL "$REQUESTED_SITE_URL" "$ENV_FILE"
    set_env_value BETTER_AUTH_TRUSTED_ORIGINS "$REQUESTED_SITE_URL" "$ENV_FILE"
    set_env_value SITE_URL "$REQUESTED_SITE_URL" "$ENV_FILE"
  fi

  chmod 600 "$ENV_FILE"
}

maybe_edit_env() {
  local editor_bin=""

  if [[ "$EDIT_MODE" == "no-edit" ]]; then
    return 0
  fi

  if [[ "$EDIT_MODE" == "auto" && "$CREATED_ENV_FILE" -ne 1 ]]; then
    return 0
  fi

  if [[ ! -t 0 || ! -t 1 ]]; then
    echo "Non-interactive shell detected; configuration editor was skipped."
    return 0
  fi

  if command -v nano >/dev/null 2>&1; then
    editor_bin="nano"
  elif [[ -n "${EDITOR:-}" ]] && command -v "$EDITOR" >/dev/null 2>&1; then
    editor_bin="$EDITOR"
  else
    editor_bin="vi"
  fi

  echo "Opening $ENV_FILE with $editor_bin"
  "$editor_bin" "$ENV_FILE"
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

inspect_schema_sync_mode() {
  local output=""

  if output="$(compose run --rm --no-deps blog /usr/local/bin/schema-sync.sh --print-mode 2>/dev/null)"; then
    echo
    echo "Database schema decision:"
    printf '%s\n' "$output" | sed 's/^/  /'
  fi
}

print_header() {
  echo
  echo "==> $1"
}

check_architecture
require_runtime

if [[ ! -f "$ENV_FILE" ]]; then
  print_header "Creating production configuration"
  prepare_env_file
else
  print_header "Reusing existing production configuration"
  refresh_release_values
fi

maybe_edit_env
compose config >/dev/null

print_header "Pulling Blog-01 and PostgreSQL images"
compose pull blog db

print_header "Starting PostgreSQL"
compose up -d --wait db

print_header "Checking database migration mode"
inspect_schema_sync_mode

print_header "Starting Blog-01"
compose up -d --wait blog

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

APP_URL="${SITE_URL%/}"
ADMIN_SETUP_URL="$APP_URL/admin/setup"
ADMIN_LOGIN_URL="$APP_URL/admin/login"

if [[ -x "$BLOGCTL" ]]; then
  chmod +x "$BLOGCTL"
fi

print_header "Blog-01 is ready"
echo "Frontend:    $APP_URL"
echo "Admin setup: $ADMIN_SETUP_URL"
echo "Admin login: $ADMIN_LOGIN_URL"
echo
echo "Initial setup token: ${ADMIN_SETUP_TOKEN}"
echo "Configuration file: $ENV_FILE"
echo
echo "Management commands:"
echo "  $BLOGCTL status"
echo "  $BLOGCTL logs"
echo "  $BLOGCTL update"
echo "  $BLOGCTL backup"
echo
echo "Keep .env.release, the database volume, and the media volume private and backed up."
