# Blog-01 服务器安装包

这个目录由 GitHub Release 自动生成，适用于 Linux AMD64 服务器。

应用镜像从 GitHub Container Registry 拉取：

```text
ghcr.io/duobaobox/blog-01:<version>
```

数据库和媒体文件分别保存在 Docker 持久化卷中，更新应用不会删除数据。

## 安装

在安装包目录执行：

```bash
sudo ./install.sh --no-edit
```

指定正式域名：

```bash
sudo ./install.sh --site-url https://blog.example.com --no-edit
```

没有反向代理时可以指定宿主机端口：

```bash
sudo ./install.sh --port 3000 --no-edit
```

安装脚本会自动：

- 验证 Linux AMD64 架构；
- 创建 `.env.release`；
- 生成 PostgreSQL 密码、Better Auth 密钥和管理员初始化口令；
- 拉取当前版本的 Blog-01 镜像；
- 启动 PostgreSQL；
- 根据数据库状态执行 migration 或兼容同步；
- 启动应用并等待健康检查通过。

安装完成后终端会输出：

- 前台地址；
- `/admin/setup` 初始化地址；
- `ADMIN_SETUP_TOKEN`；
- 配置文件位置。

## 管理

统一使用 `blogctl`：

```bash
./blogctl status
./blogctl logs
./blogctl restart
./blogctl backup
./blogctl update
```

升级到指定版本：

```bash
./blogctl update 0.2.0
```

修改生产配置：

```bash
./blogctl config
./blogctl restart
```

## 备份与恢复

备份数据库和媒体：

```bash
./blogctl backup
```

默认备份到安装目录下的 `backups/`，保留 14 天。可以覆盖：

```bash
BACKUP_RETENTION_DAYS=30 ./blogctl backup
```

恢复前会自动创建一份当前状态备份：

```bash
./blogctl restore ./backups/20260101T000000Z
```

## 数据安全

不要执行：

```bash
docker compose down -v
```

`-v` 会删除数据库卷和媒体卷。

普通卸载使用：

```bash
./blogctl uninstall
```

它只删除容器，保留数据卷。

## 反向代理

应用默认监听宿主机 `3000` 端口。正式环境建议使用 Nginx、Caddy、1Panel 或宝塔反向代理到：

```text
http://127.0.0.1:3000
```

反向代理必须传递 `Host` 和 `X-Forwarded-Proto`。启用域名和 HTTPS 后，将 `.env.release` 中以下三个值改成完全相同的正式地址：

```env
BETTER_AUTH_URL=https://blog.example.com
BETTER_AUTH_TRUSTED_ORIGINS=https://blog.example.com
SITE_URL=https://blog.example.com
```
