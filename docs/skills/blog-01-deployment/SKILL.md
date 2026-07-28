---
name: blog-01-deployment
description: 在 Linux AMD64 服务器上使用官方 GitHub Release 和 GHCR 镜像部署、验收、运维、升级、备份、恢复及排查 Blog-01。适用于云服务器部署、域名与 HTTPS 配置、管理员初始化、生产验收、版本升级、回滚和部署故障诊断。
---

# Blog-01 部署 Skill

默认使用 Blog-01 官方发行链路。除非用户明确要求源码部署，否则不要在生产服务器上从源码构建 Next.js。

## 支持的部署模型

- 仓库：`duobaobox/blog-01`
- 平台：Linux AMD64 / x86_64
- 默认安装目录：`/opt/blog-01`
- 应用镜像：`ghcr.io/duobaobox/blog-01:<version>`
- 应用端口：`3000`
- 数据库：Docker 中的 PostgreSQL 16
- 数据库数据：Docker Volume `db_data`
- 上传媒体：Docker Volume `media_data`
- 首位管理员：通过 `/admin/setup` 和 `ADMIN_SETUP_TOKEN` 创建
- 管理入口：`/opt/blog-01/blogctl`

当前官方版本不支持 ARM64。当 `uname -m` 返回 `aarch64` 或 `arm64` 时，在修改服务器之前停止部署并明确告知用户。

## 安全规则

1. 禁止将 PostgreSQL 的 `5432` 端口暴露到公网。
2. 反向代理启用后，不要在云安全组中继续开放应用端口 `3000`。
3. 禁止执行 `docker compose down -v`，该命令会删除数据库和媒体数据卷。
4. 维护已有实例时，禁止覆盖 `/opt/blog-01/.env.release`。
5. 升级、恢复或修改高风险配置前，先执行 `./blogctl backup`。
6. 不要把 `.env.release`、数据库密码、Better Auth 密钥、API Key 或管理员初始化口令粘贴到公开日志和 Issue。
7. 在容器健康且 `/api/health` 成功之前，不得宣称部署成功。
8. 生产变更需要可复现时，应固定具体版本。`latest` 仅用于全新安装或明确升级到最新稳定版。

## 判断本次操作类型

先选择对应路径：

- **全新安装**：`/opt/blog-01` 中不存在 `.env.release`。
- **已有实例维护**：使用 `blogctl`，不要盲目重新运行根目录安装器。
- **域名切换**：应用本地可访问，但 DNS、反向代理或 HTTPS 尚未完成。
- **升级**：当前实例健康，用户希望升级版本。
- **恢复**：当前实例异常，或需要从备份恢复数据。
- **故障诊断**：先收集状态和日志，再进行修改。

只询问无法从服务器自动发现的信息，通常包括目标域名以及 DNS 是否已经指向服务器。

## 1. 部署前检查

安装前执行：

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

确认：

- CPU 架构为 `x86_64` 或 `amd64`；
- 建议至少 2 GB 内存；
- 磁盘空间充足；
- 服务器可以访问 GitHub 和 GHCR；
- `80`、`443`、`3000` 端口没有被意外占用。

云服务器安全组通常只需要开放 `22`、`80` 和 `443`。`5432` 必须保持关闭。

## 2. 全新安装

### 已有域名

DNS 已经指向服务器时，安装时直接使用真实 HTTPS 地址：

```bash
curl -fsSL \
  https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh \
  -o /tmp/blog-01-install.sh

sudo env \
  SITE_URL=https://blog.example.com \
  bash /tmp/blog-01-install.sh
```

将 `blog.example.com` 替换为真实域名。

### 安装指定版本

```bash
sudo env \
  SITE_URL=https://blog.example.com \
  BLOG_VERSION=0.1.0 \
  bash /tmp/blog-01-install.sh
```

### 暂无域名

```bash
curl -fsSL \
  https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh \
  | sudo bash
```

安装器会下载最新稳定版 GitHub Release、验证 SHA256、按需安装 Docker、生成生产密钥、拉取 GHCR 镜像、启动 PostgreSQL、执行数据库同步、启动 Blog-01，并等待健康检查通过。

## 3. 本地验证应用

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo ./blogctl version

curl -fsS http://127.0.0.1:3000/api/health
curl -fsSI http://127.0.0.1:3000/
curl -fsSI http://127.0.0.1:3000/admin/setup
```

验证失败时，先查看日志，不要反复盲目重启：

```bash
cd /opt/blog-01
sudo ./blogctl logs
```

本地部署成功至少需要满足：

- PostgreSQL 容器为 healthy；
- Blog-01 容器为 healthy；
- `/api/health` 请求成功；
- 首页能够响应；
- 创建首位管理员前，`/admin/setup` 能够响应。

## 4. 配置 Nginx 和 HTTPS

服务器已经使用 Caddy、1Panel、宝塔或其他反向代理时，保留现有代理体系，不要再安装会产生端口冲突的 Nginx。

普通 Ubuntu 服务器使用 Nginx：

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

创建 `/etc/nginx/sites-available/blog-01.conf`：

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

启用并验证配置：

```bash
sudo ln -sf \
  /etc/nginx/sites-available/blog-01.conf \
  /etc/nginx/sites-enabled/blog-01.conf

sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

只有在 DNS 已经解析到当前服务器后，才申请证书：

```bash
sudo certbot --nginx -d blog.example.com
sudo certbot renew --dry-run
```

随后验证：

```bash
curl -fsSI https://blog.example.com/
curl -fsS https://blog.example.com/api/health
```

反向代理必须保留 `Host` 和 `X-Forwarded-Proto`。当代理头或公开地址不正确时，认证可能出现 `Invalid origin`。

## 5. 校正公开访问地址

`/opt/blog-01/.env.release` 中以下三个值必须与浏览器实际访问的 Origin 完全一致，并且不要带末尾 `/`：

```env
BETTER_AUTH_URL=https://blog.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://blog.example.com
SITE_URL=https://blog.example.com
```

使用管理命令修改：

```bash
cd /opt/blog-01
sudo ./blogctl config
sudo ./blogctl restart
```

不要为了修改域名而替换整个环境变量文件。

## 6. 初始化管理员

安装器会输出管理员初始化口令，也可以仅在服务器本地读取：

```bash
cd /opt/blog-01
sudo grep '^ADMIN_SETUP_TOKEN=' .env.release
```

不要公开该口令。打开：

```text
https://blog.example.com/admin/setup
```

创建首位管理员，然后在以下地址验证登录：

```text
https://blog.example.com/admin/login
```

初始化完成后，新建并发布一篇文章，上传一张图片，并在重启应用后确认图片仍然存在。

## 7. 生产环境验收

执行所有适用检查：

```bash
cd /opt/blog-01
sudo ./blogctl status
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS https://blog.example.com/api/health
```

浏览器中验证：

- 首页；
- `/blog`；
- 管理员登录；
- 新建、保存、发布并重新打开文章；
- 上传并展示图片；
- `/robots.txt`；
- `/sitemap.xml`；
- `/feed.xml`；
- 浅色和深色主题；
- 移动端导航；
- 浏览器控制台没有 hydration 报错。

Nginx 或其他反向代理运行正常后，在云安全组中关闭公网 `3000` 端口。

## 8. 日常运维

```bash
cd /opt/blog-01

sudo ./blogctl status
sudo ./blogctl logs
sudo ./blogctl restart
sudo ./blogctl backup
sudo ./blogctl config
```

备份默认保存在：

```text
/opt/blog-01/backups/
```

有效备份必须同时包含 PostgreSQL 数据库和上传媒体。

## 9. 升级

升级前先检查并备份当前实例：

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo ./blogctl version
sudo ./blogctl backup
```

升级到最新稳定版：

```bash
sudo ./blogctl update
```

升级到指定版本：

```bash
sudo ./blogctl update 0.2.0
```

管理脚本会验证 Release 资产、创建安全备份、更新部署文件、拉取指定版本镜像、等待健康检查；新容器失败时会尝试恢复原镜像版本。

升级完成后，重新执行本地健康检查、公开健康检查、管理员登录、文章和媒体验收。

## 10. 恢复与回滚

列出可用备份：

```bash
cd /opt/blog-01
find backups -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort
```

恢复指定快照：

```bash
cd /opt/blog-01
sudo ./blogctl restore ./backups/20260101T000000Z
```

恢复命令会在覆盖当前数据前，再创建一份安全备份。

仅回滚应用版本时，指定一个已知可用的旧版本：

```bash
cd /opt/blog-01
sudo ./blogctl update 0.1.0
```

镜像回滚不会自动撤销数据库 migration。版本包含破坏性 Schema 变更时，必须遵循该版本专门提供的迁移和恢复说明。

## 11. 故障诊断顺序

严格按以下顺序收集信息，避免猜测式修改：

```bash
cd /opt/blog-01
sudo ./blogctl status
sudo docker compose --env-file .env.release -f compose.yaml ps
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=200 blog
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=200 db
curl -v http://127.0.0.1:3000/api/health
```

### GHCR 镜像拉取失败

检查：

```bash
grep -E '^(APP_IMAGE|BLOG_VERSION)=' /opt/blog-01/.env.release
sudo docker manifest inspect ghcr.io/duobaobox/blog-01:0.1.0 >/dev/null
```

确认版本真实存在，并且服务器能够访问 `ghcr.io`。

### `Invalid origin`、登录 403 或重定向循环

只检查非敏感 URL 字段：

```bash
sudo grep -E \
  '^(BETTER_AUTH_URL|BETTER_AUTH_TRUSTED_ORIGINS|SITE_URL)=' \
  /opt/blog-01/.env.release
```

确认三个值与公开 HTTPS Origin 完全一致，并且代理传递了 `Host` 和 `X-Forwarded-Proto`。

### 应用不健康

```bash
cd /opt/blog-01
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=300 blog
sudo docker compose --env-file .env.release -f compose.yaml logs --tail=200 db
```

优先检查数据库连接、migration 状态、缺失环境变量、端口冲突、文件系统和数据卷错误。

### 上传媒体返回 404

```bash
sudo docker inspect blog-app --format '{{json .Mounts}}'
```

确认 `media_data` 挂载到 `/app/public/media`。不要把文件手工复制到容器可写层。

### Nginx 返回 502

```bash
curl -fsS http://127.0.0.1:3000/api/health
sudo nginx -t
sudo journalctl -u nginx --no-pager -n 100
```

本地健康接口失败时先修复应用；本地健康正常但公开代理失败时，再修复 Nginx。

## 12. 完成报告

部署完成后，返回一份简洁报告，至少包含：

- 执行的操作；
- 已安装版本；
- 安装目录；
- 公开访问地址；
- 本地健康检查结果；
- 公开健康检查结果；
- PostgreSQL 和应用容器状态；
- HTTPS 状态；
- 管理员初始化地址，但不得暴露初始化口令；
- 是否创建备份；
- 应继续开放的端口；
- 用户仍需完成的操作，例如等待 DNS 生效。

无法完成的检查必须明确说明。不得仅因为容器已经启动就宣布部署成功。

## 项目参考文档

- [一键安装与日常运维](../../../README.md)
- [阿里云 Docker、Nginx 与 HTTPS 上线手册](../../alicloud-docker-nginx-https-guide.md)
- [Docker 构建与发版指导](../../docker-build-and-release-guide.md)
- [数据库与媒体备份恢复](../../backup-and-restore.md)
- [发版与回滚 Checklist](../../release-and-rollback-checklist.md)
