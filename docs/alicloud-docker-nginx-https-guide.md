# 阿里云 Docker + Nginx + HTTPS 上线手册

本文适用于阿里云 ECS Linux AMD64 实例。

目标架构：

```text
浏览器
  → 域名 DNS
  → Nginx 80/443
  → Blog-01 127.0.0.1:3000
  → PostgreSQL Docker 内网
```

## 1. 准备服务器

推荐：

- Ubuntu 22.04 或 24.04；
- Linux AMD64 / x86_64；
- 至少 2 GB 内存；
- 40 GB 以上磁盘。

阿里云安全组开放：

- `22`：SSH；
- `80`：HTTP；
- `443`：HTTPS。

不要开放：

- `5432`：PostgreSQL；
- `3000`：正式启用 Nginx 后可以从安全组关闭。

## 2. 配置域名

在域名 DNS 中添加 A 记录：

```text
blog.example.com → ECS 公网 IP
```

等待解析生效：

```bash
ping blog.example.com
```

## 3. 一键安装 Blog-01

登录服务器：

```bash
ssh root@服务器公网IP
```

执行：

```bash
curl -fsSL https://raw.githubusercontent.com/duobaobox/blog-01/main/install.sh -o /tmp/blog-01-install.sh
SITE_URL=https://blog.example.com bash /tmp/blog-01-install.sh
```

安装器会自动：

- 安装或检查 Docker 与 Compose v2；
- 下载最新正式 Release；
- 验证安装包 SHA256；
- 安装到 `/opt/blog-01`；
- 生成数据库密码和鉴权密钥；
- 拉取 GHCR 镜像；
- 启动 PostgreSQL；
- 执行数据库 migration；
- 启动应用并等待健康检查。

检查：

```bash
cd /opt/blog-01
./blogctl status
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:3000/api/health
```

查看日志：

```bash
./blogctl logs
```

## 4. 安装 Nginx 和 Certbot

```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx
```

创建站点配置：

```bash
nano /etc/nginx/sites-available/blog-01.conf
```

内容：

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

启用配置：

```bash
ln -sf /etc/nginx/sites-available/blog-01.conf /etc/nginx/sites-enabled/blog-01.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 5. 启用 HTTPS

```bash
certbot --nginx -d blog.example.com
certbot renew --dry-run
```

正式访问：

```text
https://blog.example.com
```

## 6. 初始化管理员

安装完成时终端会输出 `ADMIN_SETUP_TOKEN`。也可以查看：

```bash
cd /opt/blog-01
grep '^ADMIN_SETUP_TOKEN=' .env.release
```

打开：

```text
https://blog.example.com/admin/setup
```

填写初始化口令并创建管理员。

完成后登录：

```text
https://blog.example.com/admin/login
```

## 7. 验收

至少检查：

- 首页；
- `/blog`；
- `/admin/setup` 和 `/admin/login`；
- 管理员登录；
- 新建并发布文章；
- 上传图片并在前台打开；
- `/robots.txt`；
- `/sitemap.xml`；
- `/feed.xml`；
- 深色和浅色主题；
- 手机端菜单；
- 浏览器控制台无 hydration 报错。

## 8. 日常运维

查看状态：

```bash
cd /opt/blog-01
./blogctl status
```

查看日志：

```bash
./blogctl logs
```

升级：

```bash
./blogctl update
```

备份：

```bash
./blogctl backup
```

重启：

```bash
./blogctl restart
```

修改域名或 AI 等环境变量：

```bash
./blogctl config
./blogctl restart
```

## 9. 备份建议

备份同时包含：

- PostgreSQL 数据库；
- 媒体上传文件；
- SHA256 校验文件。

建议每天执行：

```bash
cd /opt/blog-01
BACKUP_RETENTION_DAYS=14 ./blogctl backup
```

可通过 cron 定时：

```bash
crontab -e
```

例如每天凌晨 3 点：

```cron
0 3 * * * cd /opt/blog-01 && BACKUP_RETENTION_DAYS=14 ./blogctl backup >> /var/log/blog-01-backup.log 2>&1
```

不要执行：

```bash
docker compose down -v
```

这会删除数据库和媒体卷。

## 10. 常见问题

### GHCR 镜像无法拉取

如果出现：

```text
denied
manifest unknown
```

检查：

- 使用的是正式发布版本；
- `ghcr.io/duobaobox/blog-01` 包已设为 Public；
- `.env.release` 中 `BLOG_VERSION` 对应真实 Release；
- 服务器可以访问 `ghcr.io`。

### 登录 403 或 Invalid origin

检查 `/opt/blog-01/.env.release`：

```env
BETTER_AUTH_URL=https://blog.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://blog.example.com
SITE_URL=https://blog.example.com
```

三项必须与浏览器实际访问地址完全一致。

同时确认 Nginx 已传递：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

### 图片 404

检查：

```bash
cd /opt/blog-01
docker inspect blog-app --format '{{json .Mounts}}'
```

应用必须把 `media_data` 挂载到：

```text
/app/public/media
```

### SEO 地址还是 localhost

检查：

- `.env.release` 的 `SITE_URL`；
- 后台站点设置中的站点地址；
- 修改配置后是否执行 `./blogctl restart`。
