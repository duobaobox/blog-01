# 离线镜像交付指南

这份文档对应当前项目的离线部署方案：

- 本地构建 `linux/amd64` 应用镜像
- 打包应用镜像、PostgreSQL 镜像和一个可直接编辑的 `docker-compose.yml`
- 把离线包传到服务器
- 服务器只修改这一个 compose 文件，然后启动

配套文件：

- [docker-compose.offline.yml](/Users/duobao/个人/个人-网站搭建/blog-01/delivery/offline/docker-compose.offline.yml)
- [build-offline-bundle.sh](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/release/build-offline-bundle.sh)
- [import-offline-bundle.sh](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/release/import-offline-bundle.sh)
- [start-offline-stack.sh](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/release/start-offline-stack.sh)

## 交付包内容

离线包生成后包含：

- `images/`
  - 应用镜像 tar
  - PostgreSQL 镜像 tar
- `config/`
  - `docker-compose.yml`
- `docs/`
  - 当前说明文档
- `scripts/`
  - 导入镜像脚本
  - 启动服务脚本
- `QUICKSTART.txt`
- `manifest.txt`
- `SHA256SUMS`

## 1. 本地生成离线包

在项目根目录执行：

```bash
bash scripts/release/build-offline-bundle.sh
```

默认行为：

- 平台固定为 `linux/amd64`
- 应用镜像标签为时间戳
- 打包 `postgres:16`
- 自动把镜像标签写入交付包里的 `config/docker-compose.yml`

生成结果位于：

```bash
dist/offline-delivery/
```

## 2. 上传到服务器

建议上传整个压缩包：

```bash
scp dist/offline-delivery/blog-01-offline-<version>.tar.gz root@your-server:/srv/
```

服务器上解压：

```bash
cd /srv
tar -xzf blog-01-offline-<version>.tar.gz
cd blog-01-offline-<version>
```

## 3. 导入镜像

执行：

```bash
bash scripts/import-offline-bundle.sh .
```

它会：

1. `docker load` 所有离线镜像
2. 检查 `config/docker-compose.yml` 是否存在

## 4. 编辑部署配置

离线方案不再使用 `.env`。

只需要编辑这一个文件：

```bash
vim config/docker-compose.yml
```

只改文件顶部的 `install-config` 区域。

至少修改这些值：

- `database-url`
- `postgres-password`
- `better-auth-secret`
- `better-auth-url`
- `site-url`
- `admin-setup-token`
- `seed-admin-email`
- `seed-admin-password`

注意：

- `database-url` 里的数据库密码必须和 `postgres-password` 保持一致
- `admin-setup-token` 是生产环境首次创建管理员账号的初始化口令，访问 `/admin/setup` 时需要填写同一个值
- 只改顶部配置值，不要改下面服务名、挂载路径和命令

如果你第一阶段只想用 IP 验证功能链路，可以先写成：

```yaml
better-auth-url: &better-auth-url "http://your-server-ip:3000"
site-url: &site-url "http://your-server-ip:3000"
```

后面接入域名和 Nginx 后，再改成正式地址。

## 5. 启动服务

执行：

```bash
bash scripts/start-offline-stack.sh .
```

这个脚本会：

1. 创建 `media` 和 `data/postgres` 目录
2. 启动 `db`
3. 显式执行 `migrate`
4. 自动执行 `seed`
5. 启动 `app`

## 6. 验证

先验证应用本体：

```bash
docker compose -f config/docker-compose.yml ps
docker compose -f config/docker-compose.yml logs app --tail=100
curl -I http://127.0.0.1:3000
```

浏览器检查：

- 首页可访问
- `/admin/login` 可访问
- 管理员能登录
- 能发文章
- 能上传图片
- `/robots.txt`
- `/sitemap.xml`
- `/feed.xml`

## 7. 持久化说明

- PostgreSQL 数据保存在交付目录下的 `config/data/postgres/`
- 本地上传文件保存在交付目录下的 `config/media/`

备份时至少覆盖：

- 数据库 volume
- `config/media/`

## 推荐推进顺序

1. 本地离线打包
2. 服务器离线导入
3. 用 IP + `3000` 端口跑通博客、登录、上传
4. 再接入 Nginx、域名、HTTPS
