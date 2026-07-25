# Blog-01 SEO 与 AI 编辑助手 PRD

> 当前实现：SEO 基础建设与 BYOK AI SEO 建议首版已接入主分支。

## 1. 文档目的

本文档定义 blog-01 第一阶段 SEO 基础建设和 BYOK AI 编辑助手的产品范围、行为边界、技术方案和验收标准。

当前项目是面向个人使用的小型博客系统。功能必须保持克制，不引入复杂的内容运营后台，不改变现有文章生命周期。

## 2. 产品目标

### 2.1 SEO 基础建设

- 让搜索引擎能够稳定抓取公开页面。
- 让搜索引擎正确理解文章标题、摘要、作者、发布时间和规范 URL。
- 为文章页提供合法、准确的 Article 结构化数据。
- 让 sitemap、robots、canonical 和公开文章状态保持一致。
- 为后续 Search Console 验证提供稳定基础。

### 2.2 AI 第一版

- 使用管理员自己的 BYOK 配置调用 AI。
- 兼容 OpenAI-compatible API，不绑定单一模型厂商。
- 帮助生成文章摘要、SEO 标题和 SEO 描述。
- AI 输出只能作为编辑建议，必须由用户确认后才会进入文章表单。
- AI 不自动发布文章，不改变“内部 / 已发布”两种状态。

## 3. 非目标

第一阶段不做以下内容：

- AI 自动发布。
- 批量自动生成文章或 SEO 页面。
- 关键词排名分数。
- 自动伪造事实、引用或个人经验。
- 复杂的实时竞品关键词研究。
- 多租户计费、额度套餐和团队协作。
- 浏览器端直接保存或调用 API Key。
- 新增“待发布”“归档”“恢复”等文章状态。

## 4. 现有架构约束

- 技术栈：Next.js 16、React 19、PostgreSQL、Prisma、Better Auth、Tiptap。
- 文章状态只有数据库技术值 `draft`（内部）和 `published`（已发布）。
- 文章写路径遵循 `parser → action → service → repository → cache invalidation`。
- 正文事实源是 Tiptap JSON，HTML、纯文本、目录、字数和阅读时长在保存时物化。
- AI 调用通过独立 `features/ai` 能力层接入，不把 Provider 逻辑写进页面组件。
- AI 生成结果不直接写数据库；用户应用建议后仍走现有文章保存流程。

## 5. 用户流程

### 5.1 SEO 基础流程

1. 用户发布一篇文章。
2. 文章详情页生成完整 Metadata。
3. 文章详情页输出 Article JSON-LD。
4. 只有已发布文章进入公开查询、RSS 和 sitemap。
5. 管理员通过 Rich Results Test 和 Search Console 检查结果。

### 5.2 AI SEO 流程

1. 管理员在文章设置的 SEO 面板点击“AI 生成建议”。
2. 浏览器将当前文章必要字段发送到站内 AI API。
3. 站内 API 校验管理员身份、输入长度和 action。
4. AI Provider 使用服务器端 BYOK 配置调用 OpenAI-compatible endpoint。
5. 服务端解析并校验结构化结果。
6. 前端展示建议，且只填充用户明确应用的字段。
7. 用户点击保存后，复用现有 `updatePost` 流程。

## 6. SEO 功能需求

### 6.1 文章 Metadata

文章页必须支持：

- `title`
- `description`
- canonical URL
- Open Graph title / description / image
- Twitter card
- published time
- modified time

如果文章没有自定义 SEO 字段，使用文章标题、摘要或正文前 160 个字符作为兜底。

### 6.2 Canonical

- 默认使用本站文章 URL。
- 用户填写的 canonical 必须是合法 HTTP/HTTPS URL。
- 第一阶段默认只接受本站 URL，避免误把文章权重指向外部站点。
- canonical URL 必须与 sitemap 中的公开 URL 保持一致。

### 6.3 Article JSON-LD

公开文章页输出 `Article` 结构化数据，至少包含：

- `@context`
- `@type`
- `headline`
- `description`
- `image`
- `datePublished`
- `dateModified`
- `author`
- `publisher`
- `mainEntityOfPage`

JSON-LD 必须从服务端真实文章数据生成，不能使用客户端拼接。

### 6.4 Sitemap / Robots

- sitemap 只输出公开可访问页面。
- 内部文章不能出现在 sitemap 和 RSS。
- robots 继续禁止 `/admin/`。
- 空分类、空标签和明显无内容页面不应进入 sitemap。

## 7. AI 功能需求

### 7.1 BYOK 配置

第一版使用服务端环境变量：

```env
AI_ENABLED=true
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=
AI_PROTOCOL=chat-completions
AI_TIMEOUT_MS=30000
AI_MAX_INPUT_CHARS=30000
```

API Key 只在服务端读取，不能下发给浏览器、不能写入日志、不能提交到仓库。

### 7.2 Provider 能力

第一版实现 `OpenAICompatibleProvider`：

- Base URL 可配置。
- API Key 可配置。
- Model 可配置。
- 默认使用 `/chat/completions` 兼容格式。
- 支持 JSON mode 时请求结构化 JSON。
- 服务端始终进行本地 JSON / Schema 校验。
- 不假设第三方服务支持所有 OpenAI 专属能力。

### 7.3 AI SEO 输出

```ts
type AiSeoMetadataResult = {
  titleCandidates: string[];
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  issues: string[];
};
```

约束：

- 不凭空补充正文没有的事实。
- 不强行堆叠关键词。
- SEO 标题和描述必须与文章主题一致。
- 输出失败时不得修改当前编辑器内容。

### 7.4 人工确认

- AI 建议默认只在前端展示。
- 不覆盖已有字段，除非用户明确点击应用。
- 应用建议后页面进入未保存状态。
- 只有点击保存或发布时才写入数据库。
- AI 生成本身不生成文章操作日志。

## 8. 错误与安全

- 所有 AI API 必须经过 `requireAdminSession()`。
- 请求正文限制最大字符数。
- 通过超时控制避免请求长期挂起。
- 对 401、403、429、5xx 返回安全的用户提示。
- 不把上游原始错误、API Key 或完整请求内容返回给客户端。
- 远程 AI 服务可能接收到文章正文，界面应明确提示这一点。
- 第一阶段不实现浏览器端 BYOK；如未来增加后台配置，密钥必须加密存储并且永不回显。

## 9. 技术落点

### SEO

- `src/infrastructure/seo/index.ts`
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/components/blog/article-json-ld.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

### AI

- `src/features/ai/lib/ai-config.ts`
- `src/features/ai/lib/ai-schema.ts`
- `src/features/ai/services/ai.service.ts`
- `src/app/api/ai/generate/route.ts`
- `src/components/admin/post-form.tsx`

## 10. 验收标准

### SEO

- 公开文章页有正确 title、description、canonical。
- 公开文章页输出合法 Article JSON-LD。
- JSON-LD 的标题、作者、日期和 URL 来自真实文章数据。
- 内部文章不进入 sitemap、RSS 和公开文章查询。
- robots 不阻塞公开内容。
- 外部错误 canonical 不会覆盖本站 canonical。

### AI

- 未配置 AI 时，页面不崩溃，只显示明确提示。
- 配置 OpenAI-compatible endpoint 后可以生成 SEO 建议。
- AI Key 不出现在浏览器网络响应、页面 HTML 和日志中。
- 生成失败不会修改当前表单。
- 用户可以看到并人工确认生成结果。
- AI 不会自动发布或改变文章状态。
- 应用建议后必须经过现有保存流程才能持久化。

## 11. 后续版本

第一版稳定后再考虑：

- 选中文本改写。
- 标题候选逐个应用。
- 图片 alt 建议。
- 内部链接建议。
- AI 调用记录和成本统计。
- Search Console 查询词辅助。
- 后台 Provider 配置和加密密钥存储。
