# Blog-01

一个基于 Next.js App Router、PostgreSQL、Prisma、Better Auth 和 Tiptap 的个人博客系统。

当前项目有两条很明确的主线：

- 博客正文走 `Tiptap JSON -> 服务端物化 -> HTML / Text / TOC`
- About / Projects / 首页这类页面先走“代码维护的静态页骨架”，暂时不做后台页面管理

这份 README 以“当前仓库真实状态”为准，重点说明项目结构、正文数据流、静态页面扩展方式和本地启动步骤。

数据库交付方面，当前仓库已经补上 Prisma baseline migration 资产，并且默认部署模式已经切到 `DB_SCHEMA_SYNC_MODE=auto`。
这意味着项目现在进入了“执行层会按环境自动选择 migrate 或 push，但历史环境仍保持兼容保护”的过渡阶段。

当前部署变量上，数据库同步模式建议这样理解：

- `DB_SCHEMA_SYNC_MODE=auto`：默认模式；空库、baseline-ready 和 fully migration-ready 环境自动走 `migrate`，历史无迁移环境继续保守走 `push`
- `DB_SCHEMA_SYNC_MODE=push`：显式兼容模式，仅在你明确知道当前环境还需要 `db push` 时使用
- `DB_SCHEMA_SYNC_MODE=migrate`：仅在目标环境已经完成 baseline / migration history 准备后再启用
- `DB_SCHEMA_SYNC_MODE=skip`：完全跳过应用启动时的 schema 同步，交给外部运维流程

旧变量 `RUN_DB_PUSH` 现在只作为兼容旧部署环境的兜底入口保留；compose 默认不再主动注入它，后续应只把 `DB_SCHEMA_SYNC_MODE` 视为主配置。
当前无论是应用容器首启，还是 `docker compose run --rm --profile tools migrate` 这条手动 schema 同步入口，都会复用同一个 `schema-sync.sh` 模式解析逻辑，避免两条链路各自维护一套分支。

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

# 本地开发默认管理员账号（仅在非生产且未设置 ADMIN_SETUP_TOKEN 时自动创建）
SEED_ADMIN_NAME="Admin"
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="admin123456"

# 生产初始化口令。生产环境首次初始化管理员时必填。
ADMIN_SETUP_TOKEN=""
```

说明：

- Prisma CLI 默认读取 `.env`，所以本项目本地开发也推荐直接使用 `.env`
- 初始化现在拆成两种模式：本地开发且未设置 `ADMIN_SETUP_TOKEN` 时，首次访问 `/admin/login` 会跳转 `/admin/setup` 自动创建默认管理员；生产环境或设置了 `ADMIN_SETUP_TOKEN` 时，`/admin/setup` 会显示初始化表单，必须用初始化口令创建自定义管理员
- 媒体上传默认走站点内置媒体库，本地开发和 Docker 部署都不需要额外配置上传路径
- 数据库里的 `media` 记录会同时保存 `storageProvider`、`storageKey`、`url` 和基础元数据，后续切对象存储时不需要重做媒体索引结构
- 如果后续要接对象存储，再额外补 `STORAGE_PROVIDER` / `BLOB_READ_WRITE_TOKEN` 这类高级配置

### 4. 初始化数据库

推荐把本地初始化分成两条路径来理解：

- 快速开发路径：优先尽快把本地环境跑起来，继续兼容 `db push`
- migrate-aware 路径：更接近当前部署/发布链路，优先让本地也沿 `DB_SCHEMA_SYNC_MODE` 的语义运行

#### 4.1 快速开发路径

```bash
npm run db:generate
npm run db:push
```

适合场景：

- 你只是想先把本地博客和后台跑起来
- 当前数据库还是你自己的开发库，不需要模拟正式发布
- 你接受 schema 同步仍然走 `prisma db push`

#### 4.2 Migrate-Aware 路径

如果你希望本地也尽量贴近当前部署链路，可以直接走统一的 schema sync 入口：

```bash
npm run db:generate
DB_SCHEMA_SYNC_MODE=auto npm run db:sync
```

这个入口会复用和 Docker / app 启动一致的 `scripts/schema-sync.sh` 逻辑：

- 空库：自动走 `migrate deploy`
- 已 baseline-ready 或 fully migration-ready：自动走 `migrate deploy`
- 历史无迁移环境：保守回落到 `db push`

如果你明确知道当前本地库应该固定使用某种模式，也可以显式指定：

```bash
DB_SCHEMA_SYNC_MODE=push npm run db:sync
DB_SCHEMA_SYNC_MODE=migrate npm run db:sync
```

#### 4.3 发布前或变更前的数据库检查

如果你要在已有数据库上发布 schema 变更，当前建议先预览差异再执行：

```bash
npm run db:preflight:release -- --schema
DB_SCHEMA_SYNC_MODE=auto npm run db:sync
```

如果你当前明确只是在历史开发库上快速同步，也可以继续直接执行：

```bash
npm run db:push
```

其中 `npm run db:preflight:release` 会统一串起当前推荐的发布前数据库检查：

- 固定执行 `db:check:sync-mode`
- 固定执行 `db:check:migrations`
- 固定执行 `db:check:migration-coverage`
- 固定执行 `db:baseline`
- 固定执行 `db:check:site-settings`
- 可选附带 `db:diff` / `db:explain:posts` / `db:backfill:post-media-references` 的 dry-run 检查

常用示例：

```bash
npm run db:preflight:release
npm run db:preflight:release -- --schema
npm run db:preflight:release -- --schema --posts --media
```

其中 `npm run db:check:site-settings` 目前主要用于检查 `siteSetting` 是否仍保持单例语义，避免历史脏数据在 schema 演进时把“站点设置只有一份”这个约束悄悄打破。
`npm run db:check:migrations` 用于判断当前数据库还处于 `db push` 时代的“无迁移历史”状态，还是已经进入 baseline-ready / migration-ready 这类可继续使用 `prisma migrate deploy` 的迁移记录阶段。
`npm run db:check:migration-coverage` 用于检查当前数据库是否已经覆盖仓库里的全部 migration；它会明确列出缺失 migration，避免把“已完成 baseline”误判成“仓库 migration 已全部落地”。
`npm run db:check:sync-mode` 用于直接打印当前环境推导出的 schema sync mode、environment kind 和 rationale；它现在也已经进入 `db:preflight:release` 必跑步骤，并会在你显式指定 `DB_SCHEMA_SYNC_MODE=push|migrate` 时校验它是否和推荐模式一致。
`npm run db:baseline` 会先输出 baseline 计划；只有显式传入 `-- --apply` 时，才会调用 `prisma migrate resolve --applied` 标记 baseline migration。
同时，`npm run db:check:migrations` 现在也会直接输出：

- `environment kind`
- 推荐的 `DB_SCHEMA_SYNC_MODE`
- 当前建议的原因说明
- 是否已经 fully migration-ready
- 缺失或额外的 migration 明细

这样在发版或切换部署模式时，不需要再只靠人工解读 migration 表状态。

如果你是新环境，优先建议使用 migration 目录作为 schema 基线来源；如果你是历史环境，建议先检查 migration 状态，再决定是否继续沿用 `db push`，或先做 baseline 再切到 `migrate deploy`。

历史环境推荐顺序：

```bash
npm run db:check:sync-mode
npm run db:check:migrations
npm run db:check:migration-coverage
npm run db:baseline
npm run db:baseline -- --apply
npx prisma migrate status
```

如果你想先在本地 PostgreSQL 上完整演练一遍“`db push -> baseline -> migrate deploy`”切换闭环，可以直接执行：

```bash
npm run db:rehearse:baseline
```

这个命令会临时创建一个独立 schema 来演练，不会改动你当前 `.env` 指向的 `public` 业务表，结束后会自动清理。

如果你要检查 posts 关键读路径是否开始命中新索引，可以直接执行：

```bash
npm run db:explain:posts
```

如果你还想看真实执行时间和 buffer 命中情况，可以执行：

```bash
npm run db:explain:posts:analyze
```

结果记录和解读基线见：

- [Posts 查询计划基线](/Users/duobao/个人/个人-网站搭建/blog-01/docs/performance/posts-query-baseline.md)

如需按当前 `.env` 重新同步默认管理员：

```bash
npm run db:seed
```

如果你已经把 `postMediaReference` schema 同步到数据库，并且想给历史文章补齐媒体引用关系，可以执行：

```bash
npm run db:backfill:post-media-references
npm run db:backfill:post-media-references -- --apply
```

默认只输出计划；只有显式传入 `-- --apply` 才会重建 `postMediaReference` 表中的历史引用数据。

### 5. 启动开发环境

```bash
npm run dev
```

默认访问：

- 前台首页：[http://localhost:3000](http://localhost:3000)
- 后台登录：[http://localhost:3000/admin/login](http://localhost:3000/admin/login)

本地开发首次启动时，先访问 `/admin/login`，系统会在“数据库里还没有任何用户”时自动跳转到 `/admin/setup` 创建默认管理员。完成后回到登录页，即可使用默认管理员账号登录：

- 账号：`admin`
- 密码：`admin123456`

如果你改了 `.env` 里的 `SEED_ADMIN_*`，这里就对应使用你自己的默认值。生产环境或显式设置 `ADMIN_SETUP_TOKEN` 时不会自动创建默认管理员，而是通过 `/admin/setup` 表单创建自定义管理员。登录后后台会提醒你补全站点标题、站点 URL 等基础信息。

### 6. Docker 启动

如果你本地是通过 Docker 跑项目，当前推荐顺序是：

```bash
docker compose up -d --build db
docker compose run --rm --profile tools migrate
docker compose up -d app
```

默认情况下，`docker compose` 现在会按 `DB_SCHEMA_SYNC_MODE=auto` 自动判断：

- 空库：自动执行 `migrate deploy`
- 已 baseline-ready 或 fully migration-ready：自动执行 `migrate deploy`
- 历史无迁移环境：继续保守执行 `db push`

如果你已经明确知道某个环境应该固定使用 Prisma Migrate，也可以显式改成：

```bash
DB_SCHEMA_SYNC_MODE=migrate docker compose run --rm --profile tools migrate
DB_SCHEMA_SYNC_MODE=migrate docker compose up -d app
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
- 行为：应用容器首启默认会按 `DB_SCHEMA_SYNC_MODE=auto` 自动判断 schema 同步方式，不需要用户手动跑 migrate

最小启动方式：

```bash
POSTGRES_PASSWORD=change-this-db-password \
BETTER_AUTH_SECRET=change-this-secret \
BETTER_AUTH_URL=http://localhost:3000 \
SITE_URL=http://localhost:3000 \
APP_PORT=3000 \
DB_SCHEMA_SYNC_MODE=auto \
docker compose -f docker-compose.release.yml up -d
```

启动后直接访问：

- 前台首页：`http://localhost:3000`
- 后台登录：`http://localhost:3000/admin/login`

本地开发且未设置 `ADMIN_SETUP_TOKEN` 时，默认管理员账号仍然是 `admin` / `admin123456`。生产环境应设置 `ADMIN_SETUP_TOKEN`，首次进入 `/admin/setup` 后用初始化表单创建自定义管理员。

如果你要在线上正式使用，至少要改掉：

- `APP_PORT`（如果 3000 已被占用）
- `DB_SCHEMA_SYNC_MODE`（只有在你明确知道当前环境不该继续用 `auto` 时才改）
- `POSTGRES_PASSWORD`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `SITE_URL`
- `ADMIN_SETUP_TOKEN`

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
- 本地开发可自动准备默认管理员；生产部署应通过 `ADMIN_SETUP_TOKEN` 和 `/admin/setup` 创建自定义管理员
- 首次部署默认会打开 `nano` 让你确认配置
- 服务启动完成后会直接打印访问地址和初始化提示

## npm Scripts

```bash
npm run dev                  # 启动开发服务器
npm run build                # 生产构建
npm start                    # 启动生产服务
npm run lint                 # ESLint

npm run db:generate          # 生成 Prisma Client
npm run db:sync              # 统一 schema sync 入口；配合 DB_SCHEMA_SYNC_MODE=auto/push/migrate 使用
npm run db:diff              # 预览当前数据库与 schema 的差异
npm run db:baseline          # 输出历史环境 baseline 计划；加 -- --apply 才会写入 migration history
npm run db:check:sync-mode   # 直接打印当前环境的 schema sync mode / environment kind / rationale
npm run db:check:migrations  # 检查当前数据库处于 legacy / baseline-ready / migration-ready 的哪种迁移状态
npm run db:check:migration-coverage # 检查当前数据库是否已覆盖仓库中的全部 migration
npm run db:rehearse:baseline # 在临时 schema 中完整演练 db push -> baseline -> migrate deploy
npm run db:backfill:post-media-references # 回填历史文章的媒体引用关系；加 -- --apply 才会写入
npm run db:explain:posts     # 查看 posts 关键读路径的 EXPLAIN 计划
npm run db:explain:posts:analyze # 查看 posts 关键读路径的 EXPLAIN ANALYZE + BUFFERS
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
