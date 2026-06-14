# Blog-01

一个基于 Next.js App Router、PostgreSQL、Prisma、Better Auth 和 Tiptap 的个人博客系统。

当前项目有两条很明确的主线：

- 博客正文走 `Tiptap JSON -> 服务端物化 -> HTML / Text / TOC`
- About / Projects / 首页这类页面先走“代码维护的静态页骨架”，暂时不做后台页面管理

这份 README 以“当前仓库真实状态”为准，重点说明项目结构、正文数据流、静态页面扩展方式和本地启动步骤。

## 适用场景

- 想要一个带后台的个人博客
- 需要文章编辑、分类、标签、媒体上传、SEO 基础能力
- 希望正文富文本可控，但静态展示页先用代码维护

## 当前功能

- 博客文章的创建、编辑、草稿、发布
- 前台博客列表 / 分类页 / 标签页分页
- 后台文章列表分页、状态筛选、关键词搜索
- 基于 Tiptap 的后台富文本编辑器
- 支持 Markdown 粘贴导入并转换为可继续编辑的内容
- 分类、标签、媒体库、站点设置
- 首页、关于、项目等公开页面
- RSS、robots.txt、sitemap
- 深色 / 浅色主题切换

## 技术栈

- 框架：Next.js 16 + React 19
- 语言：TypeScript
- 样式：Tailwind CSS v4 + shadcn/ui
- 数据库：PostgreSQL
- ORM：Prisma
- 认证：Better Auth
- 编辑器：Tiptap
- HTML 后处理：unified + rehype-pretty-code

精确依赖版本以 [package.json](./package.json) 为准。

## 快速开始

### 1. 环境要求

- 建议使用 Node.js 20+
- PostgreSQL
- npm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例文件：

```bash
cp .env.example .env
```

常用变量如下：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/blog?schema=public"

BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

SITE_URL="http://localhost:3000"

# 默认管理员账号（首次启动可直接登录，登录后建议立即修改账号和密码）
SEED_ADMIN_NAME="Admin"
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="admin123456"
```

说明：

- Prisma CLI 默认读取 `.env`，所以本项目本地开发也推荐直接使用 `.env`
- 默认会自动准备管理员账号，首次登录后台后建议立即修改登录账号和密码，并完成站点基础配置
- 媒体上传默认走站点内置媒体库，本地开发和 Docker 部署都不需要额外配置上传路径
- 数据库里的 `media` 记录会同时保存 `storageProvider`、`storageKey`、`url` 和基础元数据，后续切对象存储时不需要重做媒体索引结构
- 如需保留手动初始化能力，可额外设置 `ADMIN_SETUP_TOKEN`
- 如果后续要接对象存储，再额外补 `STORAGE_PROVIDER` / `BLOB_READ_WRITE_TOKEN` 这类高级配置

### 4. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

如需按当前 `.env` 重新同步默认管理员：

```bash
npm run db:seed
```

### 5. 启动开发环境

```bash
npm run dev
```

默认访问：

- 前台首页：[http://localhost:3000](http://localhost:3000)
- 后台登录：[http://localhost:3000/admin/login](http://localhost:3000/admin/login)

首次启动可直接使用默认管理员账号登录：

- 账号：`admin`
- 密码：`admin123456`

如果你改了 `.env` 里的 `SEED_ADMIN_*`，这里就对应使用你自己的默认值。登录后后台会提醒你先修改登录账号和密码，并补全站点标题、站点 URL 等基础信息。

### 6. Docker 启动

如果你本地是通过 Docker 跑项目，当前推荐顺序是：

```bash
docker compose up -d --build db
docker compose run --rm --profile tools migrate
docker compose up -d app
```

如需按当前 `.env` 重新同步默认管理员：

```bash
docker compose run --rm --profile tools seed
```

如需补充管理员测试内容和示例数据：

```bash
docker compose run --rm --profile tools seed
docker compose run --rm --profile tools seed-demo-posts
```

Docker 部署默认会自动持久化媒体库，不需要额外处理上传目录；上传后的文件会跟随站点一起保留。

更多部署细节见：

- [docs/docker-build-and-release-guide.md](./docs/docker-build-and-release-guide.md)

### 7. 发布版一键启动

如果后续你要把产品打成给最终用户直接用的 Docker 版本，当前仓库已经保留了一个更接近“开箱即用”的发布 compose：

- 文件：`docker-compose.release.yml`
- 目标：用户只改少量环境变量，然后直接启动
- 行为：应用容器首启会自动执行 `db:push`，不需要用户手动跑 migrate

最小启动方式：

```bash
POSTGRES_PASSWORD=change-this-db-password \
BETTER_AUTH_SECRET=change-this-secret \
BETTER_AUTH_URL=http://localhost:3000 \
SITE_URL=http://localhost:3000 \
APP_PORT=3000 \
docker compose -f docker-compose.release.yml up -d
```

启动后直接访问：

- 前台首页：`http://localhost:3000`
- 后台登录：`http://localhost:3000/admin/login`

默认管理员账号仍然是：

- 账号：`admin`
- 密码：`admin123456`

如果你要在线上正式使用，至少要改掉：

- `APP_PORT`（如果 3000 已被占用）
- `POSTGRES_PASSWORD`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `SITE_URL`
- `SEED_ADMIN_USERNAME`
- `SEED_ADMIN_PASSWORD`

### 8. 当前内测推荐：本地只打 app 镜像，服务器自己拉 PostgreSQL

如果你现在还不打算发 Docker Hub，当前最省事的方式是：

- 本地只构建 `app` 镜像
- 导出成 `tar`
- 上传到服务器
- 服务器自己拉 `postgres:16`

本地先打当前机器可运行的版本：

```bash
docker build -t blog-01-app:local .
```

如果你的服务器是常见的 `linux/amd64`，发布时本地打服务器架构版本：

```bash
docker buildx build --platform linux/amd64 -t blog-01-app:release --load .
```

导出镜像：

```bash
mkdir -p dist/app-delivery
docker save -o dist/app-delivery/blog-01-app-release.tar blog-01-app:release
```

上传到服务器后：

```bash
bash install.sh
```

这条流程的特点是：

- 本地和服务器职责很清楚
- 不需要服务器安装 Node.js 或拉源码
- PostgreSQL 继续使用官方镜像
- 跑通后再推 Docker Hub 即可平滑切换
- 默认管理员账号自动准备好，启动后直接访问 `/admin/login`
- 首次部署默认会打开 `nano` 让你确认配置
- 服务启动完成后会直接打印访问地址和后台账号信息

## npm Scripts

```bash
npm run dev                  # 启动开发服务器
npm run build                # 生产构建
npm start                    # 启动生产服务
npm run lint                 # ESLint

npm run db:generate          # 生成 Prisma Client
npm run db:push              # 推送 Prisma Schema
npm run db:seed              # 按当前 .env 同步默认管理员
npm run db:seed:demo-posts   # 灌入前后台联调用的演示文章、分类、标签
```

## 联调测试数据

为了方便测试博客分页、后台筛选和分类 / 标签页，本项目提供了一套可重复执行的演示数据脚本：

```bash
npm run db:seed:demo-posts
```

这会执行：

- 创建或更新演示分类
- 创建或更新演示标签
- 写入一批已发布 / 草稿混合的测试文章

这套演示数据已经覆盖：

- 前台博客分页
- 后台文件夹 / 草稿 / 待发布切换
- 长标题、长摘要、不同正文长度
- 分类页、标签页和搜索联调

适合验证这些流程：

- `/blog` 分页
- `/blog/categories/[slug]` 分页
- `/blog/tags/[slug]` 分页
- `/admin/posts` 搜索、状态筛选、分页

脚本文件：

- [prisma/seed-demo-posts.ts](./prisma/seed-demo-posts.ts)
- [scripts/dev/seed-demo-posts.md](./scripts/dev/seed-demo-posts.md)

## 正文数据流

这是当前项目最关键的架构约束。

### 唯一事实源

文章编辑态唯一事实源是 `post.contentJson`。

- 后台编辑器只读写 Tiptap JSON
- Markdown 不再作为主存储格式
- Markdown 只作为“粘贴 / 导入边界”

### 保存时服务端物化

保存或更新文章时，服务端会基于 `contentJson` 统一生成：

- `contentHtml`：前台直接渲染
- `contentText`：摘要、SEO 描述、阅读时长等纯文本来源
- `contentToc`：目录数据
- `wordCount`
- `readingTimeMinutes`

### 为什么这样做

- 编辑器语义和前台渲染语义一致
- 不再维护第二套 Markdown 主渲染链
- 列表页、详情页、Feed、SEO 都消费同一份物化结果

### 关键文件

- [src/features/editor/tiptap-extensions.ts](./src/features/editor/tiptap-extensions.ts)
- [src/features/editor/markdown-paste.ts](./src/features/editor/markdown-paste.ts)
- [src/features/editor/content-materializer.ts](./src/features/editor/content-materializer.ts)
- [src/components/admin/post-rich-editor.tsx](./src/components/admin/post-rich-editor.tsx)
- [src/features/posts/services/post.service.ts](./src/features/posts/services/post.service.ts)

## 编辑器与正文样式

编辑器相关样式已经从全局样式中拆出来，单独收敛在：

- [src/app/editor.css](./src/app/editor.css)

约定如下：

- `editor-prose`：编辑态和展示态共享的富文本结构样式
- `editor-prose-editable`：只属于编辑器的交互样式

对应接入点：

- 后台编辑器：[src/components/admin/post-rich-editor.tsx](./src/components/admin/post-rich-editor.tsx)
- 前台文章正文：[src/app/(public)/blog/[slug]/page.tsx](./src/app/(public)/blog/[slug]/page.tsx)

如果后续要调整任务列表、表格、正文间距，优先改 `src/app/editor.css`，不要再往 `globals.css` 里堆补丁。

## 静态页面骨架

当前首页、关于、项目这些页面，仍然是代码维护，不在后台做页面管理。

### 当前方式

- 首页：代码维护
- 关于页：代码维护
- 项目页：代码维护

这些公开页面当前做了分层缓存处理：

- About / Projects / 公共布局等稳定页面：`revalidate = 300`
- 首页 / feed / sitemap 这类会直接读数据库的入口：按当前 Docker 构建约束保留动态处理
- 文章详情页：支持 `generateStaticParams()`，数据库不可用时会优雅回退

这些页面已经统一到一套静态页骨架组件上：

- [src/components/blog/static-page-shell.tsx](./src/components/blog/static-page-shell.tsx)

里面有三层：

- `StaticPageContainer`
  - 统一外层宽度和留白
  - 首页已经在用
- `StaticPageShell`
  - 标准静态页骨架
  - 适合 about / projects / uses / contact
- `StaticPageSection`
  - 静态页里常规内容分段

### 手工新增一个静态页面

当前推荐流程：

1. 新建 `src/app/(public)/<slug>/page.tsx`
2. 复制 `about/page.tsx` 或 `projects/page.tsx`
3. 保留 `generateMetadata()`
4. 用 `StaticPageShell` 或 `StaticPageContainer` 组织页面内容
5. 在 [src/shared/config/site.config.ts](./src/shared/config/site.config.ts) 里加导航
6. 如果这是公开静态页，同时更新 [src/app/sitemap.ts](./src/app/sitemap.ts)

### 什么时候再做后台页面管理

目前不做后台页面管理，原因很直接：

- 当前博客主线是文章系统
- 静态页数量少，代码维护更简单
- 先保持统一骨架，比提前做页面搭建器更稳

如果后续真的有“频繁新增静态页、希望后台维护”的需求，再引入 `Page` 内容模型会更合适。

## 目录结构

```text
.
├── docs/                         # 部署文档、计划文档
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│   └── seed-demo-posts.ts
├── public/
├── media/                        # 本地上传目录（运行时使用，不提交到 Git）
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # 前台页面
│   │   ├── admin/                # 后台页面
│   │   ├── api/                  # Route Handlers
│   │   ├── editor.css            # 编辑器 / 正文共享样式
│   │   └── globals.css           # 全站基础样式
│   ├── components/
│   │   ├── admin/                # 后台 UI 组件
│   │   └── blog/                 # 前台博客 / 静态页组件
│   ├── features/
│   │   ├── auth/
│   │   ├── editor/
│   │   ├── media/
│   │   ├── posts/
│   │   ├── settings/
│   │   └── taxonomy/
│   ├── infrastructure/           # db / auth / seo 等基础设施
│   ├── shared/                   # 通用 UI、配置、工具
│   └── generated/                # Prisma 生成代码
├── .env.example
├── package.json
└── README.md
```

## 数据模型

核心业务表：

- `post`
- `category`
- `tag`
- `postTag`
- `siteSetting`
- `media`

认证相关表：

- `user`
- `session`
- `account`
- `verification`

文章核心字段：

- `contentJson`
- `contentHtml`
- `contentText`
- `contentToc`

完整定义见 [prisma/schema.prisma](./prisma/schema.prisma)。

## 公开路由

当前主要公开路由：

- `/`
- `/about`
- `/projects`
- `/blog`
- `/blog/[slug]`
- `/blog/categories/[slug]`
- `/blog/tags/[slug]`
- `/feed.xml`
- `/robots.txt`
- `/sitemap.xml`

## 后台路由

当前后台主要页面：

- `/admin/login`
- `/admin`
- `/admin/posts`
- `/admin/categories`
- `/admin/tags`
- `/admin/media`
- `/admin/settings`
- `/admin/account`

## 部署文档

项目部署和交付文档见：

- [文档索引](./docs/README.md)
- [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](./docs/alicloud-docker-nginx-https-guide.md)
- [发版与回滚 Checklist](./docs/release-and-rollback-checklist.md)

## 当前约定

- 正文主存储必须是 `contentJson`
- 文章展示必须消费物化后的 `contentHtml`
- 静态页先走代码维护，不在后台做页面管理
- 新增编辑器 / 正文样式，优先改 `src/app/editor.css`
- 新增静态页，优先复用 `StaticPageShell`

## 后续演进建议

如果后续继续迭代，这几个方向是自然的下一步：

- 把静态页抽成可配置的 `Page` 数据模型
- 把导航和 sitemap 从手工维护改成内容驱动
- 为静态页增加后台维护能力
- 继续细化编辑器工具栏和媒体能力
