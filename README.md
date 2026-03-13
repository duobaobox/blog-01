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

# 站点 URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
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

### 部署到 Vercel

```bash
# 连接 GitHub 仓库后在 Vercel 上创建项目
# 配置环境变量后自动部署
```

### 必要的环境变量

- `DATABASE_URL` - PostgreSQL 连接字符串
- `BETTER_AUTH_SECRET` - 认证密钥
- `BETTER_AUTH_URL` - 生产环境认证 URL
- `NEXT_PUBLIC_SITE_URL` - 生产环境站点 URL

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
