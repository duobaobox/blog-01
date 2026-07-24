# AGENTS.md

本文件适用于整个仓库，用于约束自动化编码工具和后续维护者。详细架构背景见 `docs/architecture-baseline.md`。

## 1. 协作方式

- 默认使用中文沟通，Git commit 使用简洁的中文说明。
- 当前维护模式是小步直接迭代 `main`；除非用户明确要求，不新建分支或 Pull Request。
- 开始修改前先核对当前实现、相关测试和工作区状态，保留用户已有改动。
- 一次提交只表达一个清晰目的；功能行为发生变化时同步更新测试和文档。
- 不为了“顺手优化”扩大任务范围。发现独立问题时先说明，再决定是否处理。

## 2. 项目阶段与范围

核心功能开发已基本完成，当前重点是稳定性、回归、部署和维护，不再默认扩张大功能。

当前产品边界：

- 前台博客、文章详情、分类、标签、RSS、sitemap 已纳入系统能力。
- 后台负责文章、文件夹、分类、标签、媒体、站点设置和账户管理。
- About、Projects 和首页仍是代码维护的静态页面，不擅自改造成后台 CMS。
- 文章产品状态只保留“内部 / 已发布”；数据库技术值使用 `draft / published`。
- 取消发布回到内部；文章删除是输入“删除”确认后的永久删除，不保留归档和恢复入口。
- 文件夹删除使用相同的输入确认，并原子删除其中全部文章；若包含已发布文章，必须同步刷新公开页面缓存。
- 新需求应优先复用现有模块化单体架构，避免引入第二套并行实现。

## 3. 常用命令

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

数据库相关：

```bash
npm run db:generate
DB_SCHEMA_SYNC_MODE=auto npm run db:sync
npm run db:diff
npm run db:check:migrations
npm run db:check:migration-coverage
npm run db:preflight:release
```

提交前按风险执行验证：

- 文档改动：核对命令、链接、文件路径和当前实现。
- 纯逻辑改动：运行相关测试，通常还要运行 `npm test`。
- UI 或样式改动：运行相关测试、`npm run lint` 和 `npm run build`。
- Prisma 或部署改动：额外运行数据库检查和发布预检。

如果因环境缺少数据库、凭据或网络而无法执行完整验证，必须明确说明未验证部分，不把“代码检查通过”描述成“完整构建通过”。

## 4. 架构边界

推荐写路径：

```text
UI / Form
  -> feature parser
  -> Server Action
  -> service
  -> repository
  -> cache invalidation
```

推荐读路径：

```text
page / route
  -> page-data query
  -> feature query
  -> repository
```

目录职责：

- `src/app`：路由、页面组合和 Route Handler，不承载复杂业务规则。
- `src/components`：跨 feature 的页面组合与 UI 组件。
- `src/features/*`：按业务域组织 actions、services、repositories、queries、lib 和 components。
- `src/infrastructure`：auth、db、cache、storage、SEO 等运行时能力。
- `src/shared`：真正跨业务域复用的 UI、错误模型和工具。
- `src/generated`：生成代码，不手动编辑。
- `prisma`：schema、migration 和 seed。
- `docs`：仍会指导开发、部署或排障的维护文档。

关键规则：

- 页面优先消费单一 page-data query，不直接拼装多组数据库查询。
- Action 只负责鉴权、输入解析、调用 service 和缓存失效。
- Service 负责业务校验、状态迁移、多仓储组合和操作记录。
- Repository 封装 Prisma 细节，上层不要直接依赖 Prisma 查询语法。
- 业务异常进入 `AppError` 体系，API 使用统一错误映射。
- 缓存刷新复用 `src/infrastructure/cache` 中的 helper，不散落新的 `revalidatePath` 集合。

## 5. 编辑器与保存行为

这是当前最重要的防回归区域。

- Tiptap JSON 是正文唯一事实源。
- HTML、纯文本、TOC、阅读时间和字数由服务端物化，不在客户端维护第二份真相。
- 编辑器组件生命周期只能跟文章 ID 关联，不能把 `updatedAt`、保存时间或保存响应放进 React `key`。
- 自动保存必须是后台持久化：不得触发页面刷新、路由替换、编辑器重建、选区丢失或滚动位置变化。
- 保存意图使用现有的 `autosave / navigation / manual / publish` 语义，不新增含糊的布尔状态。
- `autosave` 和 `navigation` 不进入概览操作历史。
- `manual` 记录为“保存文章”；`publish` 根据状态变化记录为“发布文章”或“取消发布”。
- 新建、删除和批量操作只有在用户主动触发时才写操作历史。
- 内容工作台的文件夹文章列表按 `createdAt` 倒序；不要改回按 `updatedAt` 排序，否则保存后会跳位。
- 保存成功后更新必要的本地状态即可，避免无条件 `router.refresh()`。

修改编辑器或保存链路时，至少覆盖：

- 连续输入触发自动保存
- 文本选区和工具栏格式操作
- 长文章底部滚动位置
- 切换文章前保存
- 手动保存与发布
- 新文章首次保存
- 保存后列表顺序
- 概览最近操作内容

## 6. 样式约定

- Tiptap 节点样式通过 `src/app/tiptap-content.scss` 聚合。
- 本地 Sass 模块使用 `@use`，不要重新引入已弃用的 Sass `@import`。
- 全局字体入口放在 `src/app/globals.css`，不要混入 Sass 模块声明之前。
- 编辑器内容样式与编辑器外壳样式分离；前台文章和后台编辑正文应复用相同内容根样式。
- 优先沿用 Tailwind 和现有 UI 组件，不创建重复的设计系统。
- 前台 Header、main、Footer 统一复用 `PublicShell`；页面独立背景通过路由组布局显式传入 `surface`，不要使用 `:has()` 或改变公共 `main` 的布局模式。

## 7. 数据与数据库

- 修改 `prisma/schema.prisma` 后运行 `npm run db:generate`。
- 不手动编辑 `src/generated/prisma`。
- 已有数据库变更前先运行 `npm run db:diff` 和 migration 状态检查。
- 不在未知历史数据库上直接切换到 `migrate deploy`。
- `DB_SCHEMA_SYNC_MODE=auto` 是默认入口；`push` 只用于历史兼容，`skip` 只用于明确跳过。
- 涉及媒体时保留 provider、storage key、URL、元数据和文章引用关系。
- 不把初始化、修复或回填写操作挂到普通 page/layout 读取链路。

## 8. 安全与部署

- 不提交真实密码、token、数据库地址或生产密钥。
- 生产环境必须设置高强度 `BETTER_AUTH_SECRET` 和 `ADMIN_SETUP_TOKEN`。
- 不依赖默认管理员密码完成生产初始化。
- Docker 交付使用 Next.js standalone 输出，并保留 `public/media` 挂载。
- 发布前遵循 `docs/release-and-rollback-checklist.md`，确认备份、迁移、健康检查和回滚路径。

## 9. 完成标准

一项改动只有在以下条件满足后才算完成：

1. 行为符合用户目标，且没有扩大范围。
2. 架构落点符合现有分层。
3. 已补充或更新必要测试。
4. 已执行与风险匹配的验证。
5. README、AGENTS 或专项文档与实际行为一致。
6. 最终说明列出修改结果、验证结果和仍存在的限制。
