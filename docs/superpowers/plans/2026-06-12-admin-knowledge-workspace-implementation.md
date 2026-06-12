# 后台知识库工作台改版实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前后台“文章列表 + 编辑器”升级成“知识树 + 上下文面板 + 文档编辑器”的内容工作台，同时保持前台博客逻辑基本不变。

**Architecture:** 采用渐进式改造。先引入新的 `topic / subtopic / post` 关系模型和内容树查询层，再把当前 `PostsWorkspace` 拆成三栏骨架，最后补充“最近编辑 / 草稿 / 待发布 / 上次工作位置”这类工作台能力。前台只弱感知专题 / 子专题，不把后台树结构直接搬到公开站点。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Prisma、PostgreSQL、shadcn/ui、Node `tsx --test`

---

## 总体实施顺序

1. 先改数据模型和查询边界
2. 再改后台主布局与信息架构
3. 再改文档编辑器上下文与恢复逻辑
4. 最后补前台弱感知与演示数据、文档

不要反过来先改 UI。没有数据结构和查询层，知识树只会变成临时假壳子。

---

### Task 1: 引入专题 / 子专题数据模型

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed-demo-posts.ts`
- Modify: `package.json`
- Test: `npm run db:generate`

- [ ] **Step 1: 在 Prisma schema 中新增专题结构**

在 `prisma/schema.prisma` 中新增两个模型，并给 `post` 增加归属字段。不要复用现有 `category`，因为 `category` 仍然是前台公开分类，语义不同。

```prisma
model topic {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subtopics subtopic[]

  @@index([sortOrder])
}

model subtopic {
  id          String   @id @default(uuid())
  topicId     String
  name        String
  slug        String
  description String?  @db.Text
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  topic topic @relation(fields: [topicId], references: [id], onDelete: Cascade)
  posts post[]

  @@unique([topicId, slug])
  @@index([topicId, sortOrder])
}
```

并在 `post` 模型中补：

```prisma
  subtopicId String?
  subtopic   subtopic? @relation(fields: [subtopicId], references: [id], onDelete: SetNull)

  @@index([subtopicId])
```

- [ ] **Step 2: 生成 Prisma Client**

Run: `npm run db:generate`  
Expected: Prisma Client 成功生成，无 schema 错误

- [ ] **Step 3: 更新演示数据脚本**

在 `prisma/seed-demo-posts.ts` 中新增一批固定演示专题 / 子专题，保证工作台改造后有真实树结构可看。

推荐固定结构：

```ts
const demoTopics = [
  {
    name: "内容系统",
    slug: "content-system",
    subtopics: [
      { name: "发布流程", slug: "publishing-flow" },
      { name: "增长策略", slug: "growth-strategy" },
    ],
  },
  {
    name: "工程实践",
    slug: "engineering-practice",
    subtopics: [
      { name: "Next.js 博客", slug: "nextjs-blog" },
      { name: "Docker 部署", slug: "docker-delivery" },
    ],
  },
];
```

并把每篇 demo post 映射到一个 `subtopic`。

- [ ] **Step 4: 写入数据库**

Run: `npm run db:seed:demo-posts`  
Expected: 主题、子主题和演示文章都能 upsert 成功

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed-demo-posts.ts package.json
git commit -m "feat: add topic and subtopic content models"
```

---

### Task 2: 建立内容树查询层与工作台数据装配

**Files:**
- Create: `src/features/content-space/repositories/topic.repository.ts`
- Create: `src/features/content-space/repositories/subtopic.repository.ts`
- Create: `src/features/content-space/queries/content-space.query.ts`
- Create: `src/features/content-space/lib/content-space-tree.ts`
- Create: `src/features/content-space/lib/content-space-tree.test.ts`
- Modify: `src/features/posts/repositories/post.repository.ts`
- Modify: `src/features/posts/queries/post.queries.ts`

- [ ] **Step 1: 新增内容树构造工具**

创建 `src/features/content-space/lib/content-space-tree.ts`，负责把 `topic / subtopic / post` 扁平数据组织成工作台树节点。

建议类型：

```ts
export type ContentTreeTopic = {
  id: string;
  name: string;
  slug: string;
  subtopics: Array<{
    id: string;
    name: string;
    slug: string;
    posts: Array<{
      id: string;
      title: string;
      status: string;
      updatedAt: Date | string;
    }>;
  }>;
};

export function buildContentTree(...) {
  // 只做纯数据组织，不碰 React
}
```

- [ ] **Step 2: 给树构造工具写测试**

在 `src/features/content-space/lib/content-space-tree.test.ts` 写至少两个测试：

```ts
test("buildContentTree nests posts under subtopics and topics", () => {
  // topic -> subtopic -> post 层级正确
});

test("buildContentTree keeps empty subtopics for creation affordances", () => {
  // 没有文章的子专题也保留，方便 UI 做新建入口
});
```

- [ ] **Step 3: 新增内容空间查询层**

创建 `src/features/content-space/queries/content-space.query.ts`，提供：

```ts
export async function getContentTree() {}
export async function getRecentEditedPosts(limit = 12) {}
export async function getDraftPosts(limit = 20) {}
export async function getReadyToPublishPosts(limit = 20) {}
```

这里不要把工作台查询塞回 `post.queries.ts`，避免 posts 模块继续膨胀。

- [ ] **Step 4: 扩展 post repository**

在 `src/features/posts/repositories/post.repository.ts` 中补：

- `subtopicId` 读写支持
- `findPostsBySubtopic`
- `findRecentlyUpdatedPosts`
- `findDraftPosts`
- `findReadyToPublishPosts`

同时把 `editablePostSelect`、`postListSelect` 扩成可读到：

```ts
subtopic: {
  select: {
    id: true,
    name: true,
    slug: true,
    topic: {
      select: { id: true, name: true, slug: true }
    }
  }
}
```

- [ ] **Step 5: 跑测试**

Run: `npm run test`  
Expected: 新增内容树测试通过，现有测试不回归

- [ ] **Step 6: Commit**

```bash
git add src/features/content-space src/features/posts/repositories/post.repository.ts src/features/posts/queries/post.queries.ts
git commit -m "feat: add content space query layer"
```

---

### Task 3: 拆分 PostsWorkspace，改成三栏知识工作台骨架

**Files:**
- Modify: `src/app/admin/(protected)/posts/page.tsx`
- Create: `src/components/admin/content-space-shell.tsx`
- Create: `src/components/admin/content-space-sidebar.tsx`
- Create: `src/components/admin/content-space-context-panel.tsx`
- Create: `src/components/admin/content-editor-shell.tsx`
- Modify: `src/components/admin/post-form.tsx`
- Deprecate/Modify: `src/components/admin/posts-workspace.tsx`

- [ ] **Step 1: 把现有大组件拆开**

当前 `src/components/admin/posts-workspace.tsx` 太大，而且是“列表思维”写出来的。  
新骨架拆为：

- `content-space-shell.tsx`：三栏整体布局
- `content-space-sidebar.tsx`：左栏知识树与快捷入口
- `content-space-context-panel.tsx`：中栏上下文区
- `content-editor-shell.tsx`：右栏包装 post form

`posts-workspace.tsx` 可以先保留为过渡壳，内部逐步替换；不要一把删掉，先减风险。

- [ ] **Step 2: 后台 route 改为装配内容空间数据**

在 `src/app/admin/(protected)/posts/page.tsx` 中，把核心数据来源从：

```ts
posts + pagination + status filter
```

改成：

```ts
contentTree
recentEdited
draftPosts
readyToPublishPosts
selectedPost
```

并保留当前 URL 级别的：

- `postId`
- `view`
- `q`

但把 `page` 从主导航参数降为兼容参数，只在某些上下文列表中使用。

- [ ] **Step 3: 左栏从“文章列表”改成“内容空间导航”**

左栏内容至少包括：

- 搜索
- 最近编辑
- 草稿
- 待发布
- 专题树
- 新建按钮

结构示意：

```tsx
<ContentSpaceSidebar
  quickEntries={[
    { key: "recent", label: "最近编辑" },
    { key: "drafts", label: "草稿" },
    { key: "ready", label: "待发布" },
  ]}
  tree={contentTree}
  activeEntry={...}
  activePostId={...}
/>
```

- [ ] **Step 4: 中栏承接上下文，而不是继续做分页列表**

中栏需要按当前选中节点切换：

- 最近编辑视图
- 草稿视图
- 待发布视图
- 专题视图
- 子专题视图
- 文章元信息视图

重点：中栏要让用户知道“我在哪个结构里”，而不是只看一堆文章标题。

- [ ] **Step 5: 右栏继续复用 PostForm，但补结构上下文**

在 `src/components/admin/post-form.tsx` 中补：

- 所属专题 / 子专题展示
- 移动文章到其他子专题的入口
- “返回所在专题”或“查看同专题文章”的快捷入口

不要把这些做成一个新页面，优先做成编辑器顶部上下文条或右侧属性抽屉。

- [ ] **Step 6: 手工验证**

手工验证流：

1. 打开 `/admin/posts`
2. 左栏能展开专题树
3. 点“最近编辑”看到上下文列表
4. 点某个子专题看到该子专题文章
5. 点某篇文章后右栏正常编辑

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/(protected)/posts/page.tsx src/components/admin
git commit -m "feat: replace post list with content space workspace"
```

---

### Task 4: 引入“上次工作位置”与轻工作台能力

**Files:**
- Create: `src/features/content-space/lib/workspace-session.ts`
- Create: `src/features/content-space/lib/workspace-session.test.ts`
- Modify: `src/components/admin/content-space-shell.tsx`
- Modify: `src/components/admin/content-space-context-panel.tsx`

- [ ] **Step 1: 先用 localStorage 实现上次工作位置**

第一版不要上数据库，先做客户端持久化，降低改造成本。

在 `src/features/content-space/lib/workspace-session.ts` 中提供：

```ts
export type WorkspaceSession = {
  activeEntry: "recent" | "drafts" | "ready" | "topic" | "subtopic" | "post";
  topicId?: string;
  subtopicId?: string;
  postId?: string;
};

export function loadWorkspaceSession(): WorkspaceSession | null {}
export function saveWorkspaceSession(session: WorkspaceSession): void {}
```

- [ ] **Step 2: 写纯函数测试**

在 `workspace-session.test.ts` 中验证：

- 序列化 / 反序列化结构正确
- 非法数据回退为 `null`

- [ ] **Step 3: 后台打开时优先恢复上次位置**

逻辑顺序：

1. 如果 URL 明确带 `postId`，优先 URL
2. 否则读取 `localStorage`
3. 如果没有记录，则进入最近编辑或第一篇草稿

这一步是“像笔记软件”的关键体验，不要跳过。

- [ ] **Step 4: 中栏增加轻工作台能力**

在 `content-space-context-panel.tsx` 里加：

- 最近编辑列表
- 草稿列表
- 待发布列表
- 空状态提示

不要做传统 dashboard 图表，保持“创作者工作流视图”。

- [ ] **Step 5: 手工验证**

1. 打开某篇文章
2. 刷新后台
3. 能恢复到刚才那篇文章
4. 从草稿切到最近编辑再切回来不丢位置

- [ ] **Step 6: Commit**

```bash
git add src/features/content-space/lib src/components/admin
git commit -m "feat: restore last workspace position"
```

---

### Task 5: 前台补弱感知 + 更新文档与演示数据

**Files:**
- Modify: `src/features/posts/components/post-list-card.tsx`
- Modify: `src/app/(public)/blog/[slug]/page.tsx`
- Modify: `prisma/seed-demo-posts.ts`
- Modify: `README.md`
- Modify: `docs/docker-build-and-release-guide.md`

- [ ] **Step 1: 在前台文章详情页补轻量专题 / 子专题信息**

只做弱感知，不改成知识库站点。推荐放在标题区或 metadata 区：

```tsx
<div className="text-sm text-muted-foreground">
  <span>{post.subtopic?.topic.name}</span>
  <span> / </span>
  <span>{post.subtopic?.name}</span>
</div>
```

- [ ] **Step 2: 在列表卡片中可选显示专题信息**

不要大改列表结构，只在部分卡片中轻量显示，避免干扰博客感。

- [ ] **Step 3: 演示数据补齐专题树**

更新 `prisma/seed-demo-posts.ts`，确保演示内容不仅有文章，还能覆盖：

- 2 个专题
- 每个专题 2 个子专题
- 多篇草稿 / 已发布文章混合分布

- [ ] **Step 4: 文档更新**

更新这些文档：

- `README.md`
- `docs/docker-build-and-release-guide.md`

补充：

- 后台工作台新骨架说明
- 如何初始化演示专题树
- 如何验证后台知识树工作流

- [ ] **Step 5: 最终验证**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- lint 通过
- test 通过
- build 通过
- `/admin/posts` 能展示知识树工作台

- [ ] **Step 6: Commit**

```bash
git add README.md docs/docker-build-and-release-guide.md prisma/seed-demo-posts.ts src/features/posts/components/post-list-card.tsx src/app/(public)/blog/[slug]/page.tsx
git commit -m "feat: expose topic context in admin and public views"
```

---

## 风险与约束

### 1. 不要复用 category 充当 topic

`category` 是公开博客分类，`topic/subtopic` 是后台知识结构。  
两者语义不同，强行复用会让前后台边界混乱。

### 2. 不要一开始就做团队协作能力

当前阶段重点是：

- 结构
- 写作流
- 发布流

评论、协作者、审核流都应延后。

### 3. 不要把工作台做成数据 dashboard

避免走向“总文章数 / PV / 图表”的通用后台。  
当前差异化应该放在创作连续性，不是运营看板。

### 4. 不要试图一步把前台也知识库化

这次目标是：

- 后台强结构
- 前台弱感知

不要在同一轮里同时重构前台信息架构。

---

## 推荐执行方式

推荐按 Task 1 → Task 5 顺序执行，每个 Task 单独 commit。  
如果中途某一层体验不对，直接回滚最近一个 Task 的 commit，而不是大范围混改。

这套顺序的核心价值是：

- 每一步都能跑起来
- 每一步都能验证
- 每一步都能回退
