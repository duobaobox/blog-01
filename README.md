# 个人博客系统 (Blog-01)

一个现代化的全栈个人博客系统，采用 **Next.js + React + PostgreSQL + Prisma** 技术栈构建。支持自定义前台设计和标准博客后台管理。

## 项目特性

- ✨ 自定义前台设计（首页、关于、项目等）
- 📝 完整的博客内容管理系统
- 🎨 深色/浅色主题切换
- 📱 响应式设计
- 🔐 管理员后台登录与内容发布
- 📖 Markdown 编辑与代码高亮
- 🏷️ 标签和分类系统
- 🚀 SEO 优化（sitemap、robots.txt、RSS）
- ⚡ 服务端渲染 (SSR) 与性能优化

## 技术栈

| 模块     | 技术               | 版本   |
| -------- | ------------------ | ------ |
| 框架     | Next.js            | 16.1.6 |
| 语言     | TypeScript         | ^5     |
| UI 库    | React              | 19.2.3 |
| 样式     | Tailwind CSS       | ^4     |
| ORM      | Prisma             | ^7.5.0 |
| 数据库   | PostgreSQL         | -      |
| 认证     | Better Auth        | ^1.5.5 |
| Markdown | remark/rehype      | ^4.0.1 |
| 组件库   | shadcn/ui, Base UI | -      |

## 快速开始

### 前置要求

- Node.js 18+ 和 npm/yarn/pnpm
- PostgreSQL 数据库

### 1. 环境配置

复制环境变量文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 配置以下变量：

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/blog?schema=public"

# Better Auth 认证配置
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
ADMIN_SETUP_TOKEN=""

# 站点 URL
SITE_URL="http://localhost:3000"

# 媒体存储：local | vercel-blob
STORAGE_PROVIDER="local"

# 仅 vercel-blob 模式需要
BLOB_READ_WRITE_TOKEN=""
```

### 2. 安装依赖

```bash
npm install
```

### 3. 数据库初始化

```bash
# 推送 Prisma Schema 到数据库
npm run db:push

# （可选）填充示例数据
npm run db:seed
```

说明：

- 首次初始化管理员账号后，公开注册会被自动关闭。
- 生产环境建议配置 `ADMIN_SETUP_TOKEN`，并在执行 `npm run db:seed` 时使用同一个值完成首次管理员创建。

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 可用的 npm 脚本

```bash
# 启动开发服务器
npm run dev

# 生产环境构建
npm run build

# 启动生产环境
npm start

# 代码检查
npm run lint

# 数据库操作
npm run db:push      # 推送Schema变更
npm run db:seed      # 填充示例数据
npm run db:generate  # 生成Prisma客户端
```

## 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── (public)/          # 公共前台页面
│   │   ├── page.tsx       # 首页
│   │   ├── about/         # 关于页
│   │   ├── projects/      # 项目页
│   │   └── blog/          # 博客系统
│   ├── admin/             # 后台管理
│   │   ├── login/         # 登录页
│   │   ├── posts/         # 文章管理
│   │   ├── categories/    # 分类管理
│   │   ├── tags/          # 标签管理
│   │   └── settings/      # 站点设置
│   ├── api/               # API 路由
│   └── (layout & meta)
├── components/            # React 组件
│   ├── site/             # 前台组件
│   ├── blog/             # 博客组件
│   ├── admin/            # 后台组件
│   ├── shared/           # 共享组件
│   └── ui/               # UI 基础组件
├── lib/                   # 应用工具库
│   ├── auth/             # 认证相关
│   ├── db/               # 数据库工具
│   ├── markdown/         # Markdown 处理
│   ├── seo/              # SEO 工具
│   └── utils/            # 通用工具
├── actions/              # Server Actions
├── prisma/               # Prisma 配置
│   └── schema.prisma     # 数据模型定义
├── styles/               # 全局样式
└── public/               # 静态资源
```

## 核心功能

### 前台功能

- 🏠 自定义首页展示
- 👤 个人介绍页面
- 🎯 项目展示页面
- 📚 博客文章列表与搜索
- 📄 文章详情页（含目录、代码高亮）
- 🏷️ 按标签和分类浏览
- 🌓 主题切换

### 后台功能

- 🔐 管理员登录
- ✍️ 文章编辑与发布
- 📋 文章分类管理
- 🏷️ 标签管理
- ⚙️ 站点设置
- 📋 草稿与发布管理
- 👁️ 草稿实时预览

## 数据模型

主要数据表：

- `user` - 用户（来自 Better Auth）
- `session` - 用户会话
- `posts` - 博客文章
- `categories` - 文章分类
- `tags` - 文章标签
- `post_tags` - 文章-标签关系表
- `site_settings` - 站点设置

## 开发工作流

1. **开发** → 修改代码并在本地测试
2. **数据库** → 修改 schema 后运行 `npm run db:push`
3. **提交** → Git 提交代码
4. **部署** → 推送到 Vercel（或其他平台）

## 部署

详细运行手册见：

- [Docker 构建与发版指导](/Users/duobao/个人/个人-网站搭建/blog-01/docs/docker-build-and-release-guide.md)
- [阿里云 Docker + Nginx + HTTPS 上线手册](/Users/duobao/个人/个人-网站搭建/blog-01/docs/alicloud-docker-nginx-https-guide.md)
- [离线镜像交付指南](/Users/duobao/个人/个人-网站搭建/blog-01/docs/offline-image-delivery-guide.md)
- [发版与回滚 Checklist](/Users/duobao/个人/个人-网站搭建/blog-01/docs/release-and-rollback-checklist.md)

### 推荐：Docker Compose 部署（app + db + volume）

这是当前项目最推荐的上线方式，部署模型接近 Typecho / WordPress 常见的容器化方案：应用、数据库、持久化存储一起由 Compose 管理。

#### 1. 配置环境变量

先复制环境变量：

```bash
cp .env.example .env
```

如果你使用 Compose 自带的 PostgreSQL，可以保留下面这一组：

```env
POSTGRES_USER=blog
POSTGRES_PASSWORD=change-me
POSTGRES_DB=blog
POSTGRES_PORT=5432
```

然后把应用侧配置补齐：

```env
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://your-domain.com
SITE_URL=https://your-domain.com
ADMIN_SETUP_TOKEN=your-random-token
STORAGE_PROVIDER=local
```

#### 2. 启动数据库和应用

```bash
docker compose up -d --build
```

#### 3. 初始化数据库结构

```bash
docker compose run --rm --profile tools migrate
```

#### 4. 首次创建管理员

```bash
docker compose run --rm --profile tools seed
```

#### 5. 持久化说明

- PostgreSQL 数据保存在 Compose volume `postgres_data`
- 本地上传文件保存在项目根目录下的 `./media`
- 如果你走 `STORAGE_PROVIDER=local`，数据库和 `./media` 都应该纳入备份方案

### 部署到 Vercel

```bash
# 连接 GitHub 仓库后在 Vercel 上创建项目
# 配置环境变量后自动部署
```

说明：

- 如果部署到 Vercel，建议将 `STORAGE_PROVIDER` 设为 `vercel-blob`，并配置 `BLOB_READ_WRITE_TOKEN`
- 当前上传接口走服务端路由，Vercel 环境下更适合较小文件；较大的媒体文件更推荐自托管或后续改为客户端直传方案

### ARM / x86 架构注意事项

- 你的本地电脑是 ARM，线上阿里云服务器是 Linux x86；Docker 方案可以直接在服务器上构建镜像，天然避开本地构建产物跨架构复用的问题
- 如果你想在本地构建再推镜像，需要显式使用 `docker buildx build --platform linux/amd64`
- 不要把本地 ARM 环境下生成的 `.next` 或 `node_modules` 直接拷到 x86 服务器运行

### 必要的环境变量

- `DATABASE_URL` - PostgreSQL 连接字符串
- `BETTER_AUTH_SECRET` - 认证密钥
- `BETTER_AUTH_URL` - 生产环境认证 URL
- `ADMIN_SETUP_TOKEN` - 首次初始化管理员时使用的受控注册令牌
- `SITE_URL` - 生产环境站点 URL
- `STORAGE_PROVIDER` - 媒体存储提供方，`local` 或 `vercel-blob`
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob 读写令牌（仅 `vercel-blob` 模式）
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` - Compose 内置 PostgreSQL 配置
- `APP_PORT` / `POSTGRES_PORT` - Compose 暴露端口

## SEO 配置

项目已配置以下 SEO 功能：

- ✅ 动态 metadata（标题、描述）
- ✅ Sitemap (`/sitemap.ts`)
- ✅ Robots.txt (`/robots.ts`)
- ✅ RSS Feed (`/feed.xml`)
- ✅ Canonical URL
- ✅ Open Graph 标签支持

## 学习资源

关于本项目使用的技术，可参考以下文档：

- [Next.js 文档](https://nextjs.org/docs) - Next.js 功能和 API
- [React 文档](https://react.dev) - React 学习资源
- [Prisma 文档](https://www.prisma.io/docs/) - ORM 使用指南
- [Tailwind CSS](https://tailwindcss.com/docs) - CSS 框架
- [Better Auth](https://www.better-auth.com/) - 认证库

## 许可证

MIT

## 支持

如有问题或建议，欢迎提出 Issue 或 Discussion。
