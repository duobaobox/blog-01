# Blog-01

一个基于 Next.js App Router、PostgreSQL、Prisma、Better Auth 和 Tiptap 的个人博客系统。

当前产品已经进入可内测状态：前台博客、后台内容工作台、媒体库、分类标签、站点设置、RSS、sitemap、Docker 交付和数据库迁移基线都已经收口。About / Projects / 首页仍采用代码维护的静态页骨架，暂不做后台页面管理。

## 功能概览

- 文章创建、编辑、草稿、发布、归档、批量治理
- Tiptap 富文本编辑，支持 Markdown 粘贴导入
- 前台博客列表、分类页、标签页和文章详情页
- 后台内容工作台、文件夹、保存视图、筛选和分页
- 媒体上传、媒体库、替换、引用关系和基础元数据
- 分类、标签、站点设置、管理员账户设置
- RSS、robots.txt、sitemap、深色 / 浅色主题
- Docker 本地运行、发布包交付、Prisma baseline migration

## 技术栈

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS v4 + shadcn/ui
- PostgreSQL + Prisma
- Better Auth
- Tiptap

精确版本以 [package.json](./package.json) 为准。

## 快速开始

安装依赖：

```bash
npm install
```

创建环境变量：

```bash
cp .env.example .env
```

本地常用变量：

```env
DATABASE_URL="postgresql://blog:blog@localhost:5432/blog?schema=public"
BETTER_AUTH_SECRET="replace-with-local-secret"
BETTER_AUTH_URL="http://localhost:3000"
SITE_URL="http://localhost:3000"

SEED_ADMIN_NAME="Admin"
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="admin123456"
ADMIN_SETUP_TOKEN=""
```

初始化数据库：

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

本地开发且未设置 `ADMIN_SETUP_TOKEN` 时，首次访问后台会自动准备默认管理员。生产环境或设置了 `ADMIN_SETUP_TOKEN` 时，`/admin/setup` 会显示初始化表单，由初始化口令创建管理员。

## Docker

本地 Docker 启动：

```bash
docker compose up -d --build db
docker compose --profile tools run --rm migrate
docker compose up -d --build app
```

发布版交付入口：

```bash
docker buildx build --platform linux/amd64 -t blog-01-app:release --load .
mkdir -p dist/app-delivery
docker save -o dist/app-delivery/blog-01-app-release.tar blog-01-app:release
bash scripts/release/refresh-app-delivery.sh
tar -C dist -czf dist/app-delivery-release.tar.gz app-delivery
```

更完整的部署说明见 [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)。

## 数据库同步

当前统一使用 `DB_SCHEMA_SYNC_MODE`：

- `auto`：默认模式，按数据库状态自动选择 `migrate` 或 `push`
- `push`：历史环境兼容模式
- `migrate`：目标环境已完成 migration / baseline 后使用
- `skip`：完全跳过应用启动时的 schema 同步

常用检查：

```bash
npm run db:check:sync-mode
npm run db:check:migrations
npm run db:check:migration-coverage
npm run db:preflight:release -- --schema
```

历史库切换到 migrate 前，先看 [发版与回滚 Checklist](./docs/release-and-rollback-checklist.md)。

## 常用脚本

```bash
npm run dev
npm run build
npm run lint
npm test

npm run db:generate
npm run db:sync
npm run db:push
npm run db:preflight:release
npm run db:seed
npm run db:seed:demo-posts
```

## 目录结构

```text
src/
  app/              Next.js App Router 页面和 API
  components/       UI 组件
  features/         业务模块：posts、media、taxonomy、settings、content-space
  infrastructure/   auth、db、cache 等基础设施
  shared/           跨模块 UI 与工具
prisma/             schema、migrations、seed
scripts/            数据库检查、发布包刷新、迁移辅助脚本
docs/               当前维护文档
delivery/release/   发布包模板文件
media/              本地媒体挂载目录
```

## 核心约定

- 正文唯一事实源是 Tiptap JSON，HTML / Text / TOC 是服务端物化结果
- 后台页面只消费 page-data query，不直接组装数据库读模型
- 写路径优先走 action runner / service / repository 的分层
- 媒体记录保存 provider、storage key、URL 和基础元数据
- 生产初始化使用 `ADMIN_SETUP_TOKEN`，不要依赖默认管理员密码

架构边界见 [当前架构基线](./docs/architecture-baseline.md)。

## 文档

- [文档索引](./docs/README.md)
- [当前架构基线](./docs/architecture-baseline.md)
- [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](./docs/alicloud-docker-nginx-https-guide.md)
- [发版与回滚 Checklist](./docs/release-and-rollback-checklist.md)
- [Posts 查询计划基线](./docs/performance/posts-query-baseline.md)
