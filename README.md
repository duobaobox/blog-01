# Blog-01

一个基于 Next.js App Router、PostgreSQL、Prisma、Better Auth 和 Tiptap 的个人博客系统。

核心功能开发已基本完成，项目当前进入稳定化和发布准备阶段。前台博客、后台内容工作台、编辑器、媒体库、站点设置、SEO 输出、Docker 交付和数据库迁移基线均已落地。About、Projects 和首页仍采用代码维护的静态页面骨架，暂不纳入后台页面管理。

## 当前状态

已经稳定的主流程：

- 管理员初始化、登录和账户设置
- 文章新建、编辑、自动保存、手动保存、发布、取消发布和永久删除
- 文件夹组织私人笔记，发布状态决定是否成为公开 Blog
- 分类、标签和 SEO 按需补充，不作为写作前置条件，也不计为内容欠债
- 媒体上传、替换、引用追踪和文章封面
- 前台文章列表、详情、分类、标签、RSS 和 sitemap
- Docker standalone 构建、数据库同步和发布包交付

当前阶段不建议继续扩张大功能。发布前优先完成：

- 真实内容与真实媒体的完整回归
- 生产环境变量、管理员初始化和 HTTPS 验证
- 历史数据库 baseline / migration 演练
- `lint`、测试、构建和数据库预检
- 备份、发布与回滚流程演练

## 功能概览

- 文章创建、编辑、内部保存、发布、取消发布和输入确认删除
- Tiptap 富文本编辑，支持 Markdown 粘贴导入
- 编辑器后台自动保存，不刷新页面、不重建编辑会话
- 文章列表按创建时间稳定排序，保存和发布不会改变位置
- 概览仅记录用户主动的新建、保存、发布、取消发布、删除和批量操作
- 前台博客列表、分类页、标签页和文章详情页
- 后台三栏工作台：文件夹 → 笔记列表 → 编辑器
- 媒体上传、媒体库、替换、引用关系和基础元数据
- 分类、标签、站点设置和管理员账户设置
- RSS、robots.txt、sitemap、深色 / 浅色主题
- Docker 本地运行、发布包交付和 Prisma baseline migration

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

## 质量检查

常规改动至少执行：

```bash
npm run lint
npm test
npm run build
```

GitHub Actions 会在 `main` 推送和 Pull Request 上执行数据库 migration、lint、测试与构建。

涉及 Prisma schema、数据库发布或部署时，再执行：

```bash
npm run db:diff
npm run db:check:migrations
npm run db:check:migration-coverage
npm run db:preflight:release
```

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
npm run db:backfill:post-content
npm run db:preflight:release
npm run db:seed
npm run db:seed:demo-posts
```

## 目录结构

```text
src/
  app/              Next.js App Router 页面和 API
  components/       页面组合与 UI 组件
  features/         posts、media、taxonomy、settings、content-space 等业务模块
  infrastructure/   auth、db、cache、storage 等基础设施
  shared/           跨模块 UI 与工具
  generated/        Prisma 生成代码，不手动编辑
prisma/             schema、migrations 和 seed
scripts/            数据库检查、发布包刷新和迁移辅助脚本
docs/               当前维护文档
delivery/release/   发布包模板文件
media/              本地媒体挂载目录
```

## 核心约定

- 正文唯一事实源是 Tiptap JSON；HTML、Text、TOC、字数和阅读时长在保存时统一物化，公开页面直接读取物化结果
- 后台页面只消费 page-data query，不直接组装数据库读模型
- 写路径遵循 parser → action → service → repository → cache invalidation
- 自动保存和切换文章保存属于后台持久化，不进入最近操作历史
- 手动保存和发布必须使用明确的 save intent，并生成对应操作记录
- 编辑器组件的生命周期只跟文章 ID 关联，不能跟 `updatedAt` 或保存响应关联
- 内容工作台文章列表按 `createdAt` 排序，避免更新后跳位
- Tiptap 本地 Sass 聚合使用 `@use`，全局字体入口放在 `globals.css`
- 媒体记录保存 provider、storage key、URL 和基础元数据
- 生产初始化使用 `ADMIN_SETUP_TOKEN`，不要依赖默认管理员密码

更完整的开发约束见 [AGENTS.md](./AGENTS.md)，架构边界见 [当前架构基线](./docs/architecture-baseline.md)。

## 文档

- [协作与维护约定](./AGENTS.md)
- [文档索引](./docs/README.md)
- [当前架构基线](./docs/architecture-baseline.md)
- [前台页面框架与主题扩展](./docs/public-page-layouts.md)
- [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](./docs/alicloud-docker-nginx-https-guide.md)
- [发版与回滚 Checklist](./docs/release-and-rollback-checklist.md)
- [Posts 查询计划基线](./docs/performance/posts-query-baseline.md)
