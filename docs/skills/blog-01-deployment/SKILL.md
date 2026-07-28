---
name: blog-01-deployment
description: Deploy, validate, operate, upgrade, back up, restore, and troubleshoot Blog-01 on a Linux AMD64 server using the official GitHub Release and GHCR image. Use this skill for cloud-server deployment, domain and HTTPS setup, administrator initialization, production acceptance checks, upgrades, rollback, and deployment incident diagnosis.
---

# Blog-01 Deployment

Use the official Blog-01 release pipeline. Do not build Next.js from source on the production server unless the user explicitly requests a source deployment.

## Supported deployment model

- Repository: `duobaobox/blog-01`
- Platform: Linux AMD64 / x86_64
- Default installation directory: `/opt/blog-01`
- Application image: `ghcr.io/duobaobox/blog-01:<version>`
- Application port: `3000`
- Database: PostgreSQL 16 in Docker
- Database data: Docker volume `db_data`
- Uploaded media: Docker volume `media_data`
- First administrator: `/admin/setup` with `ADMIN_SETUP_TOKEN`
- Management entry: `/opt/blog-01/blogctl`

ARM64 is not supported by the current official release. Stop before changing the server when `uname -m` returns `aarch64` or `arm64`.

## Safety rules

1. Never expose PostgreSQL port `5432` to the public internet.
2. After a reverse proxy is active, do not expose application port `3000` in the cloud security group.
3. Never run `docker compose down -v`; it deletes the database and media volumes.
4. Never overwrite an existing `/opt/blog-01/.env.release` during maintenance.
5. Before upgrading, restoring, or making risky configuration changes, run `./blogctl backup`.
6. Do not paste `.env.release`, database passwords, Better Auth secrets, API keys, or the administrator setup token into public logs or issues.
7. Do not claim deployment success until the container is healthy and `/api/health` responds successfully.
8. Use a fixed release version for production changes when reproducibility matters. Use `latest` only for a new installation or an intentional latest-version upgrade.

## Determine the requested operation

Choose one path:

- **New installation**: `/opt/blog-01` does not contain `.env.release`.
- **Existing installation**: use `blogctl`; do not rerun the root installer blindly.
- **Domain cutover**: application works locally, but DNS, reverse proxy, or HTTPS is incomplete.
- **Upgrade**: current instance is healthy and the user wants a newer release.
- **Recovery**: current instance is unhealthy or data must be restored from a backup.
- **Diagnosis**: gather status and logs before modifying anything.

Ask only for facts that cannot be discovered from the server, normally the intended domain name and whether DNS already points to the server.

## 1. Preflight

Run these checks before installation:

```bash
set -e

uname -m
cat /etc/os-release
free -h
df -h /

command -v curl || true
command -v docker || true
docker compose version 2>/dev/null || true

ss -lntp 2>/dev/null | grep -E ':(80|443|3000|5432)\b' || true
curl -fsSI --connect-timeout 15 https://github.com >/dev/null
curl -fsSI --connect-timeout 15 https://ghcr.io >/dev/null
```

Confirm:

- architecture is `x86_64` or `amd64`;
- at least 2 GB memory is recommended;
- enough free disk space exists;
- the server can reach GitHub and GHCR;
- ports `80`, `443`, and `3000` are not unexpectedly occupied.

For a cloud server, the security group should normally allow `22`, `80`, and `443`. Port `5432` must remain closed.

## 2. New installation

### With a domain

Use the real HTTPS URL when DNS already points to the server:

```bash
curl -fsSL \
  https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh \
  -o /tmp/blog-01-install.sh

sudo env \
  SITE_URL=https://blog.example.com \
  bash /tmp/blog-01-install.sh
```

Replace `blog.example.com` with the real domain.

### Install a specific release

```bash
sudo env \
  SITE_URL=https://blog.example.com \
  BLOG_VERSION=0.1.0 \
  bash /tmp/blog-01-install.sh
```

### Without a domain

```bash
curl -fsSL \
  https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh \
  | sudo bash
```

The installer downloads the latest stable GitHub Release, verifies its SHA256 file, installs Docker when required, generates production secrets, pulls the GHCR image, starts PostgreSQL, applies database synchronization, starts Blog-01, and waits for health checks.

## 3. Validate the application locally

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo ./blogctl version

curl -fsS http://127.0.0.1:3000/api/health
curl -fsSI http://127.0.0.1:3000/
curl -fsSI http://127.0.0.1:3000/admin/setup
```

When validation fails, inspect logs before restarting repeatedly:

```bash
cd /opt/blog-01
sudo ./blogctl logs
```

A successful local deployment requires:

- PostgreSQL container is healthy;
- Blog-01 container is healthy;
- `/api/health` succeeds;
- the homepage responds;
- `/admin/setup` responds before the first administrator is created.

## 4. Configure Nginx and HTTPS

Skip package installation when the server already uses Caddy, 1Panel, 宝塔, or another reverse proxy. Preserve the existing proxy system instead of installing a competing one.

For a plain Ubuntu server using Nginx:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

Create `/etc/nginx/sites-available/blog-01.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name blog.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and test it:

```bash
sudo ln -sf \
  /etc/nginx/sites-available/blog-01.conf \
  /etc/nginx/sites-enabled/blog-01.conf

sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Issue the certificate only after DNS resolves to this server:

```bash
sudo certbot --nginx -d blog.example.com
sudo certbot renew --dry-run
```

Then verify:

```bash
curl -fsSI https://blog.example.com/
curl -fsS https://blog.example.com/api/health
```

The reverse proxy must preserve `Host` and `X-Forwarded-Proto`; authentication can fail with `Invalid origin` when those headers or the public URL are wrong.

## 5. Correct the public URL

The following values in `/opt/blog-01/.env.release` must use the exact browser origin, with no trailing slash:

```env
BETTER_AUTH_URL=https://blog.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://blog.example.com
SITE_URL=https://blog.example.com
```

Use the managed editor:

```bash
cd /opt/blog-01
sudo ./blogctl config
sudo ./blogctl restart
```

Do not replace the full environment file just to change the domain.

## 6. Initialize the administrator

The installer prints an initialization token. It can also be read locally on the server:

```bash
cd /opt/blog-01
sudo grep '^ADMIN_SETUP_TOKEN=' .env.release
```

Do not publish the token. Open:

```text
https://blog.example.com/admin/setup
```

Create the first administrator, then verify login at:

```text
https://blog.example.com/admin/login
```

After setup, test creating and publishing an article and uploading one image. Confirm that the image still exists after an application restart.

## 7. Production acceptance

Complete all applicable checks:

```bash
cd /opt/blog-01
sudo ./blogctl status
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS https://blog.example.com/api/health
```

Verify in a browser:

- homepage;
- `/blog`;
- administrator login;
- create, save, publish, and reopen an article;
- upload and display an image;
- `/robots.txt`;
- `/sitemap.xml`;
- `/feed.xml`;
- light and dark themes;
- mobile navigation;
- no hydration errors in the browser console.

After Nginx or another reverse proxy is working, close public port `3000` in the cloud security group.

## 8. Daily operations

```bash
cd /opt/blog-01

sudo ./blogctl status
sudo ./blogctl logs
sudo ./blogctl restart
sudo ./blogctl backup
sudo ./blogctl config
```

Backups are stored under:

```text
/opt/blog-01/backups/
```

A backup must include both PostgreSQL and uploaded media.

## 9. Upgrade

First inspect and back up the current installation:

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo ./blogctl version
sudo ./blogctl backup
```

Upgrade to the latest stable release:

```bash
sudo ./blogctl update
```

Upgrade to a specific release:

```bash
sudo ./blogctl update 0.2.0
```

The management script verifies the Release asset, creates a safety backup, updates the deployment files, pulls the selected image, waits for health checks, and attempts to restore the previous image version when the new container fails.

After upgrade, repeat the local health check, public health check, login, article, and media acceptance checks.

## 10. Restore and rollback

List available backups:

```bash
cd /opt/blog-01
find backups -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort
```

Restore a selected snapshot:

```bash
cd /opt/blog-01
sudo ./blogctl restore ./backups/20260101T000000Z
```

The restore command creates another safety backup before replacing current data.

For an application-only rollback, use a known previous release:

```bash
cd /opt/blog-01
sudo ./blogctl update 0.1.0
```

Image rollback does not automatically reverse database migrations. When a release contains destructive schema changes, follow that release's dedicated migration and recovery instructions.

## 11. Diagnosis order

Use this order and avoid speculative changes:

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo docker compose --env-file .env.release -f compose.yaml ps
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=200 blog
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=200 db
curl -v http://127.0.0.1:3000/api/health
```

### GHCR pull failure

Check:

```bash
grep -E '^(APP_IMAGE|BLOG_VERSION)=' /opt/blog-01/.env.release
sudo docker manifest inspect ghcr.io/duobaobox/blog-01:0.1.0 >/dev/null
```

Confirm that the version exists and the server can access `ghcr.io`.

### `Invalid origin`, login 403, or redirect loop

Check only the non-secret URL fields:

```bash
sudo grep -E \
  '^(BETTER_AUTH_URL|BETTER_AUTH_TRUSTED_ORIGINS|SITE_URL)=' \
  /opt/blog-01/.env.release
```

Confirm they exactly match the public HTTPS origin and that the proxy sends `Host` and `X-Forwarded-Proto`.

### Application unhealthy

```bash
cd /opt/blog-01
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=300 blog
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=200 db
```

Look first for database connectivity, migration state, missing environment variables, port conflicts, and filesystem or volume errors.

### Uploaded media returns 404

```bash
sudo docker inspect blog-app --format '{{json .Mounts}}'
```

Confirm that `media_data` is mounted at `/app/public/media`. Do not manually copy files into the container writable layer.

### Nginx returns 502

```bash
curl -fsS http://127.0.0.1:3000/api/health
sudo nginx -t
sudo journalctl -u nginx --no-pager -n 100
```

Fix the application first when the local health endpoint fails. Fix Nginx when local health succeeds but the public proxy fails.

## 12. Completion report

Return a concise deployment report containing:

- operation performed;
- installed version;
- installation directory;
- public URL;
- local health result;
- public health result;
- PostgreSQL and application container status;
- HTTPS status;
- administrator setup URL, without exposing the token;
- backup created, when applicable;
- ports that should remain open;
- any remaining user action, such as DNS propagation.

State clearly when a check could not be completed. Never report the deployment as successful based only on containers being started.

## Project references

- [One-click installation and operation](../../../README.md)
- [AliCloud Docker, Nginx, and HTTPS guide](../../alicloud-docker-nginx-https-guide.md)
- [Docker build and release guide](../../docker-build-and-release-guide.md)
- [Backup and restore](../../backup-and-restore.md)
- [Release and rollback checklist](../../release-and-rollback-checklist.md)
