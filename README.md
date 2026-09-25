# Blog-01

[![CI](https://github.com/duobaobox/blog-01/actions/workflows/ci.yml/badge.svg)](https://github.com/duobaobox/blog-01/actions/workflows/ci.yml)
[![Release](https://github.com/duobaobox/blog-01/actions/workflows/release.yml/badge.svg)](https://github.com/duobaobox/blog-01/actions/workflows/release.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

一个基于 Next.js、PostgreSQL、Prisma、Better Auth 和 Tiptap 的开源自托管博客系统。

Blog-01 同时提供简洁的公开博客和完整的后台内容工作台，适合部署到自己的云服务器。官方发行版通过 GitHub Actions 自动构建 Linux AMD64 容器镜像，并提供版本化安装、升级、备份和恢复工具。

## 一键安装

系统要求：

- Linux AMD64 / x86_64；
- Ubuntu 22.04、24.04 或其他常见 Linux 发行版；
- 建议至少 2 GB 内存；
- 服务器可以访问 GitHub 和 GitHub Container Registry。

从 GitHub Release 下载版本化安装器并校验后执行：

```bash
RELEASE_URL="https://github.com/duobaobox/blog-01/releases/latest/download"
curl -fL -o /tmp/blog-01-installer.sh "$RELEASE_URL/blog-01-installer.sh"
curl -fL -o /tmp/blog-01-installer.sh.sha256 "$RELEASE_URL/blog-01-installer.sh.sha256"
(
  cd /tmp
  sha256sum -c blog-01-installer.sh.sha256
  sudo bash ./blog-01-installer.sh
)
```

安装器会自动安装或检查 Docker，下载最新正式版本，生成安全密钥，启动 PostgreSQL 和 Blog-01，并等待健康检查通过。

默认安装目录：

```text
/opt/blog-01
```

默认访问地址：

```text
http://服务器公网IP:3000
```

首次安装完成后，终端会显示管理员初始化口令。打开：

```text
http://服务器公网IP:3000/admin/setup
```

使用初始化口令创建第一个管理员。

### 安装时指定域名

DNS 已经指向服务器时，可以直接写入正式地址：

```bash
RELEASE_URL="https://github.com/duobaobox/blog-01/releases/latest/download"
curl -fL -o /tmp/blog-01-installer.sh "$RELEASE_URL/blog-01-installer.sh"
curl -fL -o /tmp/blog-01-installer.sh.sha256 "$RELEASE_URL/blog-01-installer.sh.sha256"
(
  cd /tmp
  sha256sum -c blog-01-installer.sh.sha256
  sudo env SITE_URL=https://blog.example.com bash ./blog-01-installer.sh
)
```

应用仍监听 `3000` 端口，需要使用 Nginx、Caddy、1Panel 或宝塔反向代理并配置 HTTPS。

### 安装指定版本

```bash
RELEASE_TAG="v0.1.0"
RELEASE_URL="https://github.com/duobaobox/blog-01/releases/download/$RELEASE_TAG"
curl -fL -o /tmp/blog-01-installer.sh "$RELEASE_URL/blog-01-installer.sh"
curl -fL -o /tmp/blog-01-installer.sh.sha256 "$RELEASE_URL/blog-01-installer.sh.sha256"
(
  cd /tmp
  sha256sum -c blog-01-installer.sh.sha256
  sudo env BLOG_VERSION=0.1.0 bash ./blog-01-installer.sh
)
```

当前官方镜像只发布 `linux/amd64`。ARM64 暂不在首个公开版本的支持范围内。

## 日常管理

进入安装目录：

```bash
cd /opt/blog-01
```

查看状态：

```bash
sudo ./blogctl status
```

查看日志：

```bash
sudo ./blogctl logs
```

重启：

```bash
sudo ./blogctl restart
```

修改环境配置：

```bash
sudo ./blogctl config
sudo ./blogctl restart
```

升级到最新正式版本：

```bash
sudo ./blogctl update
```

升级到指定版本：

```bash
sudo ./blogctl update 0.2.0
```

升级前会自动备份数据库和媒体；如果新容器无法通过健康检查，管理脚本会尝试恢复到原镜像版本。

## 备份与恢复

创建数据库和媒体备份：

```bash
cd /opt/blog-01
sudo ./blogctl backup
```

默认保存在：

```text
/opt/blog-01/backups/
```

恢复指定快照：

```bash
sudo ./blogctl restore ./backups/20260101T000000Z
```

恢复前会再次创建当前状态备份。

不要使用：

```bash
docker compose down -v
```

`-v` 会删除 PostgreSQL 和媒体持久化卷。

## 功能

- 文章新建、编辑、自动保存、手动保存、发布、取消发布和永久删除；
- Tiptap 富文本编辑器，支持 Markdown 粘贴导入；
- 文件夹、分类和标签组织；
- 媒体上传、媒体库、封面和引用追踪；
- 后台三栏内容工作台；
- 站点设置、管理员账户设置和首次安装向导；
- RSS、robots.txt、sitemap 和基础 SEO；
- 深色和浅色主题；
- 可选的 OpenAI Compatible AI 服务；
- Docker 健康检查、数据库 migration、备份与恢复；
- GitHub Actions CI、GHCR 镜像和 GitHub Release 自动发版。

## 技术栈

- Next.js 16 + React 19；
- TypeScript；
- Tailwind CSS v4 + shadcn/ui；
- PostgreSQL 16 + Prisma；
- Better Auth；
- Tiptap；
- Docker Compose。

精确依赖版本以 [package.json](./package.json) 为准。

## 本地开发

准备 Node.js 22、Docker 和 Docker Compose。

```bash
git clone https://github.com/duobaobox/blog-01.git
cd blog-01
npm ci
cp .env.example .env
```

启动 PostgreSQL：

```bash
docker compose up -d db
```

生成 Prisma Client 并同步开发数据库：

```bash
npm run db:generate
DB_SCHEMA_SYNC_MODE=auto npm run db:sync
```

启动开发服务：

```bash
npm run dev
```

访问：

- 前台：<http://localhost:3000>
- 后台：<http://localhost:3000/admin/login>

本地开发且没有设置 `ADMIN_SETUP_TOKEN` 时，可以使用开发环境默认管理员。生产环境必须通过 `/admin/setup` 和初始化口令创建管理员。

## 质量检查

提交前至少执行：

```bash
npm run lint
npm test
npm run build
```

CI 会在 Pull Request 和 `main` 分支推送时：

1. 启动临时 PostgreSQL；
2. 执行 Prisma migration；
3. 运行 lint、测试和 Next.js build；
4. 构建 Linux AMD64 生产镜像；
5. 启动真实生产容器；
6. 验证健康检查、首页、管理员初始化页和 MVP 浏览器闭环（初始化、登录、媒体上传、公开博客入口）。

## 发布

正式版本采用语义化标签：

```bash
git tag -a v0.1.0 -m "Blog-01 v0.1.0"
git push origin v0.1.0
```

Release workflow 会自动：

- 再次执行完整质量检查；
- 构建并推送 `ghcr.io/duobaobox/blog-01` AMD64 镜像；
- 生成版本标签和 `latest` 标签；
- 生成服务器安装包、版本化安装器及其 SHA256 校验文件；
- 生成构建来源证明；
- 创建 GitHub Release。

带连字符的标签会作为预发布版本，例如：

```text
v0.2.0-rc.1
```

预发布版本不会覆盖 `latest`。

## 数据库同步

生产容器统一使用 `DB_SCHEMA_SYNC_MODE`：

- `auto`：按数据库状态选择 migration 或兼容同步；
- `push`：历史环境兼容模式；
- `migrate`：已纳入 Prisma migration 管理的环境；
- `skip`：由外部系统负责数据库迁移。

全新安装会自动使用仓库中的 migration。历史数据库升级前请先备份，并参考 [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)。

## 目录结构

```text
src/                    Next.js 应用与业务模块
prisma/                 Schema、migration 和 seed
delivery/release/       服务器安装包模板
scripts/release/        Release 资产构建脚本
.github/workflows/      CI 和自动发版
docs/                   架构、部署、备份和维护文档
```

## 安全

- 不要提交 `.env`、`.env.release` 或真实 API 密钥；
- 生产环境必须使用随机 `BETTER_AUTH_SECRET`；
- 完成管理员初始化后妥善保管 `.env.release`；
- 数据库端口不应暴露到公网；
- 正式环境建议只开放 `22`、`80` 和 `443`；
- 数据库与媒体必须一起备份。

安全问题请不要创建公开 Issue，处理方式见 [SECURITY.md](./SECURITY.md)。

## 文档

- [文档索引](./docs/README.md)
- [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](./docs/alicloud-docker-nginx-https-guide.md)
- [备份与恢复](./docs/backup-and-restore.md)
- [发版与回滚 Checklist](./docs/release-and-rollback-checklist.md)
- [当前架构基线](./docs/architecture-baseline.md)

## License

Blog-01 使用 [MIT License](./LICENSE) 开源。
