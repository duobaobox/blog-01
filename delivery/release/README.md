# Blog-01 服务器部署

## 1. 上传这些文件到服务器

- `blog-01-app-release.tar`
- `docker-compose.release.yml`
- `.env.release.example`
- `install.sh`

## 2. 一键安装

最简单方式：

```bash
bash install.sh
```

脚本会自动：

- 生成 `.env.release`
- 自动填充数据库密码、鉴权密钥、默认后台密码
- 自动猜测当前服务器 IP，写入访问地址
- 自动写入 Better Auth 允许登录的来源地址
- 导入应用镜像
- 启动应用和数据库
- 如果是首次部署，默认会先打开 `nano` 让你确认配置
- 最后直接打印前台 / 后台访问地址和管理员账号

如果你明确不想编辑配置，直接跳过：

```bash
bash install.sh . --no-edit
```

如果你想强制再次打开配置检查：

```bash
bash install.sh . --edit
```

这会优先用 `nano` 打开 `.env.release`，保存后再继续安装。

## 3. 手动方式

```bash
docker load -i blog-01-app-release.tar
cp .env.release.example .env.release
nano .env.release
docker compose --env-file .env.release -f docker-compose.release.yml up --wait
```

如果登录时报 `Invalid origin`，优先检查这三项是否和你实际访问地址一致：

- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `SITE_URL`

## 4. 访问

- 前台：`http://你的域名或IP:端口`
- 后台：`http://你的域名或IP:端口/admin/login`

默认管理员账号：

- 账号默认是 `.env.release` 里的 `SEED_ADMIN_USERNAME`
- 密码以 `.env.release` 里的 `SEED_ADMIN_PASSWORD` 为准

登录时尽量始终使用同一个访问地址，比如全程都用 `http://47.100.193.93:3000`，不要先用 IP 再切 localhost 或域名，这样可以避免 `Invalid origin`。
