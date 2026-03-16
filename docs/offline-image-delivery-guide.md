# 离线镜像交付与阿里云测试指南

## 目标

这份文档用于支持当前阶段的交付方式：

- 先在本地生成 `linux/amd64` 离线镜像包
- 将离线包传到阿里云服务器
- 在服务器上不依赖镜像仓库，直接 `docker load + docker compose up`
- 测通后，再考虑上传到在线镜像仓库

配套文件：

- [docker-compose.offline.yml](/Users/duobao/个人/个人-网站搭建/blog-01/delivery/offline/docker-compose.offline.yml)
- [.env.offline.example](/Users/duobao/个人/个人-网站搭建/blog-01/delivery/offline/.env.offline.example)
- [build-offline-bundle.sh](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/release/build-offline-bundle.sh)
- [import-offline-bundle.sh](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/release/import-offline-bundle.sh)
- [start-offline-stack.sh](/Users/duobao/个人/个人-网站搭建/blog-01/scripts/release/start-offline-stack.sh)

## 交付包里有什么

离线交付包生成后会包含：

- `images/`
  - 应用镜像 tar
  - PostgreSQL 镜像 tar
- `config/`
  - 离线版 `docker-compose.yml`
  - `.env.example`
- `docs/`
  - Docker 构建与发版指导
  - 阿里云上线手册
  - 发版与回滚清单
  - 本离线指南
- `scripts/`
  - 导入镜像脚本
  - 启动服务脚本
- `manifest.txt`
- `SHA256SUMS`

## 本地生成离线包

在项目根目录执行：

```bash
bash scripts/release/build-offline-bundle.sh
```

默认行为：

- 使用 `linux/amd64`
- 构建应用镜像 `blog-01-app:<timestamp>`
- 拉取 `postgres:16`
- 导出为 tar 文件
- 生成一个完整离线包目录
- 额外再打一个 `.tar.gz`

## 常用自定义参数

### 固定镜像标签

```bash
APP_IMAGE_TAG=v0.1.0 bash scripts/release/build-offline-bundle.sh
```

### 固定输出目录

```bash
OUTPUT_ROOT="$PWD/delivery/out" bash scripts/release/build-offline-bundle.sh
```

### 明确目标平台

```bash
PLATFORM=linux/amd64 bash scripts/release/build-offline-bundle.sh
```

## 从本地拷到阿里云

建议传整个压缩包：

```bash
scp dist/offline-delivery/blog-01-offline-<version>.tar.gz root@your-server:/srv/
```

服务器上解压：

```bash
cd /srv
tar -xzf blog-01-offline-<version>.tar.gz
cd blog-01-offline-<version>
```

## 在阿里云服务器导入镜像

执行：

```bash
bash scripts/import-offline-bundle.sh .
```

它会做两件事：

1. `docker load` 所有镜像 tar
2. 如果 `config/.env` 不存在，就从模板复制一个出来

## 在阿里云服务器启动服务

先编辑环境变量：

```bash
vim config/.env
```

至少改这些值：

- `POSTGRES_PASSWORD`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_SETUP_TOKEN`

然后启动：

```bash
bash scripts/start-offline-stack.sh .
```

如果是首次部署，再执行 seed：

```bash
docker compose -f config/docker-compose.yml --env-file config/.env run --rm --profile tools seed
```

## 离线测试阶段建议

如果你当前只是为了上阿里云验证，不一定要先接 HTTPS，可以先做这几步：

1. 先用服务器 IP + `APP_PORT` 测试容器是否可用
2. 确认数据库、登录、发文、上传图片都正常
3. 再接 Nginx 和域名
4. 最后再做 HTTPS

这样排障会更简单。

## 检查项

至少确认：

- 首页可访问
- 后台登录正常
- 能发文章
- 能上传图片
- `/robots.txt`
- `/sitemap.xml`
- `/feed.xml`

## 当前建议的推进顺序

### 第一阶段

- 本地离线打包
- 阿里云离线导入
- 用本地 volume 模式测试完整业务链路

### 第二阶段

- 接 Nginx
- 接域名
- 接 HTTPS

### 第三阶段

- 再考虑推送到在线镜像仓库
- 再考虑 CI/CD 或自动化发版
