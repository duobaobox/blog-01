#!/usr/bin/env bash

set -euo pipefail

BUNDLE_PATH="."
EDIT_MODE="auto"

for arg in "$@"; do
  case "$arg" in
    --edit)
      EDIT_MODE="--edit"
      ;;
    --no-edit)
      EDIT_MODE="--no-edit"
      ;;
    *)
      BUNDLE_PATH="$arg"
      ;;
  esac
done

BUNDLE_DIR="$(cd "$BUNDLE_PATH" && pwd)"
IMAGE_TAR="$BUNDLE_DIR/blog-01-app-release.tar"
COMPOSE_FILE="$BUNDLE_DIR/docker-compose.release.yml"
ENV_TEMPLATE="$BUNDLE_DIR/.env.release.example"
ENV_FILE="$BUNDLE_DIR/.env.release"
CREATED_ENV_FILE=0

if [[ ! -f "$IMAGE_TAR" ]]; then
  echo "Image tar not found: $IMAGE_TAR"
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [[ ! -f "$ENV_TEMPLATE" ]]; then
  echo "Env template not found: $ENV_TEMPLATE"
  exit 1
fi

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48
    printf '\n'
  fi
}

is_private_ip() {
  local ip="$1"

  case "$ip" in
    10.*|127.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[0-1].*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

print_header() {
  echo
  echo "==> $1"
}

detect_server_ip() {
  local detected_ip=""

  if command -v hostname >/dev/null 2>&1; then
    detected_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi

  if [[ -z "$detected_ip" ]] && command -v ip >/dev/null 2>&1; then
    detected_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ { for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
  fi

  if [[ -z "$detected_ip" ]]; then
    detected_ip="127.0.0.1"
  fi

  printf '%s\n' "$detected_ip"
}

read_env_value() {
  local key="$1"
  local file="$2"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, "", $0); print $0; exit }' "$file"
}

replace_env_value() {
  local key="$1"
  local value="$2"
  sed -i "s#^${key}=.*#${key}=${value}#" "$ENV_FILE"
}

print_schema_sync_hint() {
  local mode="${1:-unknown}"
  local env_kind="${2:-unknown}"

  echo
  echo "Schema sync decision:"
  echo "  mode: $mode"
  echo "  environment kind: $env_kind"
}

inspect_schema_sync_mode() {
  local output=""

  if ! docker compose version >/dev/null 2>&1; then
    return 0
  fi

  if ! output="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm --no-deps blog /usr/local/bin/schema-sync.sh --print-mode 2>/dev/null)"; then
    return 0
  fi

  local mode env_kind
  mode="$(printf '%s\n' "$output" | awk -F': ' '/Resolved DB schema sync mode:/ { print $2; exit }')"
  env_kind="$(printf '%s\n' "$output" | awk -F': ' '/environment kind:/ { print $2; exit }')"

  if [[ -n "$mode" ]]; then
    print_schema_sync_hint "$mode" "${env_kind:-unknown}"
    echo "$output" | sed 's/^/  detail: /'
  fi
}

start_database_only() {
  if docker compose version >/dev/null 2>&1; then
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d db
    return 0
  fi

  echo "docker compose is not available."
  exit 1
}

prepare_env_file() {
  local app_port server_ip default_site_url

  cp "$ENV_TEMPLATE" "$ENV_FILE"

  app_port="$(read_env_value "APP_PORT" "$ENV_TEMPLATE")"
  if [[ -z "$app_port" ]]; then
    app_port="3000"
  fi

  server_ip="$(detect_server_ip)"
  default_site_url="http://${server_ip}:${app_port}"

  replace_env_value "POSTGRES_PASSWORD" "$(generate_secret)"
  replace_env_value "BETTER_AUTH_SECRET" "$(generate_secret)"
  replace_env_value "ADMIN_SETUP_TOKEN" "$(generate_secret | cut -c1-24)"
  replace_env_value "BETTER_AUTH_URL" "$default_site_url"
  replace_env_value "BETTER_AUTH_TRUSTED_ORIGINS" "$default_site_url"
  replace_env_value "SITE_URL" "$default_site_url"

  chmod 600 "$ENV_FILE"
  CREATED_ENV_FILE=1

  if is_private_ip "$server_ip"; then
    echo
    echo "Detected private server IP: $server_ip"
    echo "Before first login, change BETTER_AUTH_URL / BETTER_AUTH_TRUSTED_ORIGINS / SITE_URL"
    echo "to your public IP or domain in $ENV_FILE."
  fi
}

maybe_edit_env() {
  local editor_bin=""

  if [[ "$EDIT_MODE" == "--no-edit" ]]; then
    return 0
  fi

  if [[ "$EDIT_MODE" == "auto" && "$CREATED_ENV_FILE" -ne 1 ]]; then
    return 0
  fi

  if [[ ! -t 0 || ! -t 1 ]]; then
    echo "Skip editor because current shell is not interactive."
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
  echo "Save and exit, then installation will continue."
  "$editor_bin" "$ENV_FILE"
}

start_stack() {
  if docker compose version >/dev/null 2>&1; then
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up --wait blog
    return 0
  fi

  echo "docker compose is not available."
  exit 1
}

if [[ ! -f "$ENV_FILE" ]]; then
  print_header "[1/4] Creating .env.release with generated defaults"
  prepare_env_file
else
  print_header "[1/4] Reusing existing .env.release"
fi

maybe_edit_env

print_header "[2/4] Loading app image"
docker load -i "$IMAGE_TAR"

print_header "[3/5] Starting database"
start_database_only

print_header "[4/5] Inspecting schema sync mode"
inspect_schema_sync_mode

print_header "[5/5] Starting app"
start_stack
print_header "Stack is ready"

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

APP_URL="${SITE_URL:-${BETTER_AUTH_URL:-http://$(detect_server_ip):${APP_PORT:-3000}}}"
ADMIN_URL="${APP_URL%/}/admin/login"

echo
echo "Install complete."
echo "Open:"
echo "  Frontend: $APP_URL"
echo "  Admin:    $ADMIN_URL"
echo
echo "Important:"
echo "  Use the same host everywhere when you log in."
echo "  For example, if you open $APP_URL, then log in on that exact address."
if printf '%s' "$APP_URL" | grep -Eq '://(10\.|127\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)'; then
  echo "  Current address looks like an internal IP. If this is a public server,"
  echo "  update BETTER_AUTH_URL / BETTER_AUTH_TRUSTED_ORIGINS / SITE_URL before browser testing."
fi
echo
echo "Admin setup:"
echo "  Open:  ${APP_URL%/}/admin/setup"
echo "  Token: ${ADMIN_SETUP_TOKEN:-<set ADMIN_SETUP_TOKEN in .env.release>}"
echo "  Create your own admin account in the setup form before logging in."
echo
echo "Useful commands:"
echo "  Logs:     docker compose --env-file .env.release -f docker-compose.release.yml logs -f blog"
echo "  Stop:     docker compose --env-file .env.release -f docker-compose.release.yml down"
echo "  Restart:  docker compose --env-file .env.release -f docker-compose.release.yml up --wait"
