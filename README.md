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
# 生产环境必须设置；首次访问 /admin/setup 创建管理员时填写同一口令
ADMIN_SETUP_TOKEN=""

SITE_URL="http://localhost:3000"

STORAGE_PROVIDER="local"
BLOB_READ_WRITE_TOKEN=""

SEED_ADMIN_NAME="Admin"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="admin123456"
```

说明：

- Prisma CLI 默认读取 `.env`，所以本项目本地开发也推荐直接使用 `.env`
- `NODE_ENV=production` 时，首次管理员注册必须设置并填写 `ADMIN_SETUP_TOKEN`
- `STORAGE_PROVIDER=local` 时，媒体文件走本地存储
- `STORAGE_PROVIDER=vercel-blob` 时，需要额外配置 `BLOB_READ_WRITE_TOKEN`

### 4. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

如需初始化开发管理员：

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

## npm Scripts

```bash
npm run dev                  # 启动开发服务器
npm run build                # 生产构建
npm start                    # 启动生产服务
npm run lint                 # ESLint

npm run db:generate          # 生成 Prisma Client
npm run db:push              # 推送 Prisma Schema
npm run db:seed              # 初始化开发管理员和示例数据

npm run release:offline:build  # 生成离线交付包
```

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
├── public/
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
- `/admin/setup`
- `/admin`
- `/admin/posts`
- `/admin/categories`
- `/admin/tags`
- `/admin/media`
- `/admin/settings`
- `/admin/account`

## 部署文档

项目部署和交付文档见：

- [Docker 构建与发版指导](./docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](./docs/alicloud-docker-nginx-https-guide.md)
- [离线镜像交付指南](./docs/offline-image-delivery-guide.md)
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
