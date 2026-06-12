# 后台内容工作台 V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/admin/posts` 重构为「内容库 / 文章列表 / 纯编辑器」三栏工作区，并移除当前中栏大卡片与右栏冗余导航。

**Architecture:** 在现有 `ContentSpaceShell` 体系上做收缩式改造，而不是重写后台。保留现有 URL 状态、内容树查询和编辑器表单，重点重构三个可视组件的职责边界：第一栏只负责状态切换和文件夹树，第二栏只负责上下文内文章列表，第三栏只保留轻量面包屑与编辑动作。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Node `tsx --test`、Docker Compose、shadcn/ui

---

## 文件边界

### 现有文件职责

- `src/app/admin/(protected)/posts/page.tsx`
  - 后台内容工作区路由装配，拼装 `tree / quick counts / selected post / context posts`
- `src/components/admin/content-space-shell.tsx`
  - 三栏容器、URL 跳转、unsaved changes 守卫、移动端侧栏
- `src/components/admin/content-space-sidebar.tsx`
  - 第一栏，当前仍包含搜索和文章展开，需收缩
- `src/components/admin/content-space-context-panel.tsx`
  - 第二栏，当前包含统计卡、流程卡、分组卡片，需瘦身成轻量列表
- `src/components/admin/content-editor-shell.tsx`
  - 第三栏，当前仍保留上一篇 / 下一篇与当前分支目录，需减负
- `src/features/content-space/lib/content-space-workspace.ts`
  - URL 与上下文解析，不需要改语义，但需要确认新交互下仍成立
- `src/features/content-space/lib/content-space-sidebar-state.ts`
  - 当前仍服务“树里展开文章”能力，本轮需要收缩测试和逻辑
- `src/features/content-space/lib/content-space-context.ts`
  - 第二栏轻量上下文文案可继续保留，但输出会变简单
- `src/features/content-space/lib/content-space-view-model.ts`
  - 第二栏空状态 / 标题文案继续保留，但不再驱动大卡片
- `src/features/content-space/lib/content-space-list-sections.ts`
  - 当前服务“按行动分组文章列表”，若保留则要缩减其使用场景；若废弃需同步删测试
- `src/features/content-space/lib/content-space-workflow.ts`
  - 当前只服务中栏流程卡，本轮应移除其 UI 依赖，必要时直接退场

### 测试文件

- `src/features/content-space/lib/content-space-workspace.test.ts`
- `src/features/content-space/lib/content-space-sidebar-state.test.ts`
- `src/features/content-space/lib/content-space-context.test.ts`
- `src/features/content-space/lib/content-space-view-model.test.ts`
- `src/features/content-space/lib/content-space-list-sections.test.ts`
- `src/features/content-space/lib/content-space-workflow.test.ts`

---

### Task 1: 收缩第一栏为切换组件 + 文件夹树

**Files:**
- Modify: `src/components/admin/content-space-sidebar.tsx`
- Modify: `src/features/content-space/lib/content-space-sidebar-state.ts`
- Test: `src/features/content-space/lib/content-space-sidebar-state.test.ts`

- [ ] **Step 1: 先写第一栏收缩后的纯函数测试**

在 `src/features/content-space/lib/content-space-sidebar-state.test.ts` 里，把测试目标改成“专题 / 子专题展开状态”而不是“子专题里文章展开”。

保留这三类断言：

```ts
test("deriveSidebarExpansionState expands the active topic and subtopic", () => {
  const state = deriveSidebarExpansionState(createInput());
  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, true);
});

test("deriveSidebarExpansionState respects user-expanded topics even when inactive", () => {
  const state = deriveSidebarExpansionState(
    createInput({
      topicId: "topic-2",
      subtopicId: "subtopic-2",
      activeTopicId: "topic-1",
      activeSubtopicId: "subtopic-1",
      activePostId: undefined,
      expandedTopicIds: ["topic-2"],
    }),
  );

  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, false);
});

test("deriveSidebarExpansionState forces expansion during search mode", () => {
  const state = deriveSidebarExpansionState(
    createInput({
      forceExpandAllForSearch: true,
      activeTopicId: undefined,
      activeSubtopicId: undefined,
      activePostId: undefined,
    }),
  );

  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, true);
});
```

删除 `getVisiblePostsForSidebarSubtopic` 相关断言，因为新设计不允许第一栏展开文章。

- [ ] **Step 2: 运行测试，确认它先失败**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-sidebar-state.test.ts
```

Expected: FAIL，原因是现有实现仍暴露文章展开逻辑或测试内容未同步

- [ ] **Step 3: 精简 sidebar state 工具，只保留专题 / 子专题展开**

在 `src/features/content-space/lib/content-space-sidebar-state.ts` 中把接口收缩为：

```ts
export type SidebarExpansionInput = {
  topicId: string;
  subtopicId: string;
  activeTopicId?: string;
  activeSubtopicId?: string;
  activePostId?: string;
  expandedTopicIds: string[];
  expandedSubtopicIds: string[];
  forceExpandAllForSearch: boolean;
};

export function deriveSidebarExpansionState(input: SidebarExpansionInput) {
  const topicExpanded =
    input.forceExpandAllForSearch ||
    input.expandedTopicIds.includes(input.topicId) ||
    input.activeTopicId === input.topicId ||
    input.activeSubtopicId === input.subtopicId;

  const subtopicExpanded =
    input.forceExpandAllForSearch ||
    input.expandedSubtopicIds.includes(input.subtopicId) ||
    input.activeSubtopicId === input.subtopicId ||
    (input.activePostId !== undefined &&
      input.activeTopicId === input.topicId &&
      input.activeSubtopicId === input.subtopicId);

  return { topicExpanded, subtopicExpanded };
}
```

删除 `getVisiblePostsForSidebarSubtopic` 导出。

- [ ] **Step 4: 改造第一栏组件**

在 `src/components/admin/content-space-sidebar.tsx` 中做这几件事：

1. 删除搜索框
2. 删除顶部“像笔记一样组织文章...”副文案
3. 把 `最近编辑 / 草稿 / 待发布` 改成横向切换组件
4. 把顶部新建文章按钮改成 `+ 添加文件夹`
5. 删除子专题下文章列表渲染

建议顶部结构直接改成：

```tsx
<div className="border-b px-3 py-3">
  <div className="mb-3 text-sm font-semibold text-foreground">内容库</div>

  <Tabs
    value={activeEntry === "drafts" || activeEntry === "ready" ? activeEntry : "recent"}
    onValueChange={(value) =>
      void onSelectEntry(value as "recent" | "drafts" | "ready")
    }
    suppressHydrationWarning
  >
    <TabsList className="grid w-full grid-cols-3" suppressHydrationWarning>
      <TabsTrigger value="recent" suppressHydrationWarning>最近编辑</TabsTrigger>
      <TabsTrigger value="drafts" suppressHydrationWarning>草稿</TabsTrigger>
      <TabsTrigger value="ready" suppressHydrationWarning>待发布</TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

文件夹区头部改成：

```tsx
<div className="mb-2 flex items-center justify-between px-2">
  <div className="text-[11px] font-medium tracking-wide text-muted-foreground">
    文件夹
  </div>
  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
    <FilePlus2 className="size-3.5" />
    添加文件夹
  </Button>
</div>
```

文件夹按钮本轮不接真实创建逻辑，先用 `type="button"` + `disabled` 或提示占位，避免误导。

- [ ] **Step 5: 运行测试，确认第一栏收缩完成**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-sidebar-state.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/content-space-sidebar.tsx src/features/content-space/lib/content-space-sidebar-state.ts src/features/content-space/lib/content-space-sidebar-state.test.ts
git commit -m "feat: simplify content space sidebar structure"
```

---

### Task 2: 把第二栏瘦身为轻量头部 + 文章列表

**Files:**
- Modify: `src/components/admin/content-space-context-panel.tsx`
- Modify: `src/features/content-space/lib/content-space-context.ts`
- Modify: `src/features/content-space/lib/content-space-view-model.ts`
- Modify: `src/features/content-space/lib/content-space-context.test.ts`
- Modify: `src/features/content-space/lib/content-space-view-model.test.ts`
- Delete or Modify: `src/features/content-space/lib/content-space-list-sections.ts`
- Delete or Modify: `src/features/content-space/lib/content-space-list-sections.test.ts`
- Delete or Modify: `src/features/content-space/lib/content-space-workflow.ts`
- Delete or Modify: `src/features/content-space/lib/content-space-workflow.test.ts`

- [ ] **Step 1: 为第二栏轻量头部写文案测试**

在 `src/features/content-space/lib/content-space-view-model.test.ts` 中把断言改成只覆盖：

```ts
test("buildContentSpaceViewModel uses recency-oriented helper copy for recent view", () => {
  const viewModel = buildContentSpaceViewModel(createInput());

  assert.equal(viewModel.sectionTitle, "最近编辑");
  assert.equal(viewModel.emphasis, "继续上次工作");
  assert.equal(viewModel.emptyTitle, "还没有最近内容");
});

test("buildContentSpaceViewModel changes helper copy for drafts", () => {
  const viewModel = buildContentSpaceViewModel(createInput({ entry: "drafts" }));

  assert.equal(viewModel.sectionTitle, "草稿");
  assert.equal(viewModel.emphasis, "优先补全未完成内容");
  assert.equal(viewModel.emptyTitle, "还没有草稿");
});

test("buildContentSpaceViewModel changes helper copy for ready posts", () => {
  const viewModel = buildContentSpaceViewModel(createInput({ entry: "ready" }));

  assert.equal(viewModel.sectionTitle, "待发布");
  assert.equal(viewModel.emphasis, "适合做最后确认");
  assert.equal(viewModel.emptyTitle, "还没有待发布内容");
});
```

同时从测试中删除 `workflowLabel` 相关断言。

- [ ] **Step 2: 为第二栏上下文摘要保留必要信息**

在 `src/features/content-space/lib/content-space-context.test.ts` 中继续保留计数测试，但把 hint 目标收敛为轻量说明。

例如：

```ts
test("buildContentContextSummary produces contextual label for search views", () => {
  const summary = buildContentContextSummary(
    createInput({
      entry: "search",
      searchQuery: "docker",
      topicName: undefined,
      subtopicName: undefined,
    }),
  );

  assert.equal(summary.contextLabel, "搜索结果");
  assert.equal(summary.hint, "关键词：docker");
});
```

- [ ] **Step 3: 先跑测试，确认当前实现和新预期不一致**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-view-model.test.ts src/features/content-space/lib/content-space-context.test.ts
```

Expected: FAIL，原因是当前实现仍服务旧中栏结构

- [ ] **Step 4: 收缩 view model 和 context helper**

在 `src/features/content-space/lib/content-space-view-model.ts` 中更新返回值，不再包含 `workflowLabel`：

```ts
export type ContentSpaceViewModel = {
  sectionTitle: string;
  emphasis: string;
  emptyTitle: string;
};
```

关键分支改成：

```ts
if (input.entry === "drafts") {
  return {
    sectionTitle: "草稿",
    emphasis: "优先补全未完成内容",
    emptyTitle: "还没有草稿",
  };
}

if (input.entry === "ready") {
  return {
    sectionTitle: "待发布",
    emphasis: "适合做最后确认",
    emptyTitle: "还没有待发布内容",
  };
}
```

`src/features/content-space/lib/content-space-context.ts` 保持 `contextLabel / hint / totalCount` 这组轻量字段即可，不再为大统计区服务额外文案。

- [ ] **Step 5: 删除第二栏对旧大卡片模型的依赖**

在 `src/components/admin/content-space-context-panel.tsx` 里移除：

- `buildContentSpaceWorkflowModel`
- `buildContentSpaceListSections`
- 三列统计卡
- workflow cards

改成固定轻量结构：

```tsx
<div className="border-b px-4 py-4">
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <div className="text-sm font-semibold text-foreground">
        {meta.title}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {posts.length} 篇文章
      </div>
      {(topic || subtopic) ? (
        <div className="mt-2 text-xs text-muted-foreground">
          {topic?.name}{subtopic ? ` / ${subtopic.name}` : ""}
        </div>
      ) : null}
    </div>

    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => void onCreateNew()}>
        <ArrowUpRight className="size-3.5" />
        新建文档
      </Button>
    </div>
  </div>

  <div className="mt-3 flex items-center gap-2">
    <Input placeholder="搜索当前列表" className="h-8 text-xs" />
    <Button variant="outline" size="sm" className="h-8">排序</Button>
  </div>
</div>
```

列表区域直接渲染平铺文章项：

```tsx
<div className="flex-1 overflow-y-auto px-3 py-3">
  {posts.length === 0 ? (
    <PostsEmptyState ... />
  ) : (
    <div className="space-y-2">
      {posts.map((post) => (
        <button key={post.id} ...>
          <div className="flex items-center gap-2">
            <span className={post.status === "published" ? "bg-emerald-500" : "bg-amber-500"} />
            <span className="truncate text-sm font-medium">{getPostDisplayTitle(post.title)}</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {post.status === "published" ? "已发布" : "草稿"} · {formatRelativeDate(post.updatedAt)}
          </div>
        </button>
      ))}
    </div>
  )}
</div>
```

第二栏搜索框本轮先只作为视觉入口，若需要接入现有 URL 搜索，则应通过 `ContentSpaceShell` 传入；不要在此文件临时造本地过滤逻辑后和服务端列表脱节。

- [ ] **Step 6: 清理旧 helper 与测试**

如果 `content-space-list-sections.ts` 与 `content-space-workflow.ts` 已无调用方，则直接删除这两个文件及其测试：

```bash
git rm src/features/content-space/lib/content-space-list-sections.ts
git rm src/features/content-space/lib/content-space-list-sections.test.ts
git rm src/features/content-space/lib/content-space-workflow.ts
git rm src/features/content-space/lib/content-space-workflow.test.ts
```

如果你决定保留文件，也必须把实现改成无副作用的小工具，但本轮推荐直接移除，避免保留死代码。

- [ ] **Step 7: 跑第二栏相关测试**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-context.test.ts src/features/content-space/lib/content-space-view-model.test.ts src/features/content-space/lib/content-space-workspace.test.ts
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/content-space-context-panel.tsx src/features/content-space/lib/content-space-context.ts src/features/content-space/lib/content-space-view-model.ts src/features/content-space/lib/content-space-context.test.ts src/features/content-space/lib/content-space-view-model.test.ts
git commit -m "feat: simplify content context panel into document list"
```

如果删除了旧 helper，再补一次：

```bash
git add src/features/content-space/lib
git commit -m "refactor: remove legacy content workflow helpers"
```

---

### Task 3: 给第二栏接入真实搜索 / 新建上下文

**Files:**
- Modify: `src/components/admin/content-space-shell.tsx`
- Modify: `src/components/admin/content-space-context-panel.tsx`
- Test: `src/features/content-space/lib/content-space-workspace.test.ts`

- [ ] **Step 1: 为 URL 语义补测试**

在 `src/features/content-space/lib/content-space-workspace.test.ts` 里新增一个用例，确认从某个子专题上下文发起搜索时，URL 只保留 `q`，不保留旧 `postId`：

```ts
test("buildContentSpaceUrl clears post selection when submitting a search", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "subtopic",
      topicId: "topic-1",
      subtopicId: "subtopic-2",
      postId: "post-2",
      view: "edit",
      q: "",
    },
    next: {
      q: "docker",
      postId: undefined,
      view: "edit",
    },
  });

  assert.equal(url, "/admin/posts?q=docker");
});
```

- [ ] **Step 2: 先跑测试，确认当前行为**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-workspace.test.ts
```

Expected: PASS 或 FAIL 都可接受；如果 FAIL，修 URL 逻辑；如果 PASS，继续下一步

- [ ] **Step 3: 把搜索输入从第一栏迁移到第二栏**

在 `src/components/admin/content-space-shell.tsx` 中：

1. 保留当前 `search` state、`handleSearchSubmit`
2. 从 `ContentSpaceSidebar` props 中删除：
   - `search`
   - `onSearchChange`
   - `onSearchSubmit`
3. 传给 `ContentSpaceContextPanel`：

```tsx
search={search}
onSearchChange={setSearch}
onSearchSubmit={handleSearchSubmit}
```

`handleCreateNew` 保持不变，让“新建文档”默认继承当前 topic / subtopic 上下文。

- [ ] **Step 4: 扩展第二栏 props，并把输入接上 URL 搜索**

在 `src/components/admin/content-space-context-panel.tsx` props 里新增：

```ts
search: string;
onSearchChange: (value: string) => void;
onSearchSubmit: () => void | Promise<void>;
```

搜索输入绑定：

```tsx
<Input
  value={search}
  onChange={(event) => onSearchChange(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void onSearchSubmit();
    }
  }}
  placeholder="搜索当前列表"
  className="h-8 text-xs"
  suppressHydrationWarning
/>
<Button variant="outline" size="sm" className="h-8" onClick={() => void onSearchSubmit()}>
  搜索
</Button>
```

排序按钮本轮不接真实逻辑，只保留静态入口：

```tsx
<Button variant="outline" size="sm" className="h-8" disabled>
  排序
</Button>
```

- [ ] **Step 5: 跑测试**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-workspace.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/content-space-shell.tsx src/components/admin/content-space-context-panel.tsx src/features/content-space/lib/content-space-workspace.test.ts
git commit -m "feat: move content search into document list panel"
```

---

### Task 4: 把第三栏减成纯编辑器头部

**Files:**
- Modify: `src/components/admin/content-editor-shell.tsx`
- Modify: `src/features/content-space/lib/content-space-editor-navigation.ts`
- Modify: `src/features/content-space/lib/content-space-editor-navigation.test.ts`
- Modify: `src/features/content-space/lib/content-space-editor-outline.ts`
- Modify: `src/features/content-space/lib/content-space-editor-outline.test.ts`

- [ ] **Step 1: 先把右栏冗余导航的测试改成“无依赖”状态**

如果 `content-space-editor-navigation.ts` 和 `content-space-editor-outline.ts` 只服务 `上一篇 / 下一篇` 与 `当前分支目录`，本轮目标是把它们退场。

优先检查这两个测试文件是否仍有其它调用方；若无，则直接删除：

```bash
git rm src/features/content-space/lib/content-space-editor-navigation.ts
git rm src/features/content-space/lib/content-space-editor-navigation.test.ts
git rm src/features/content-space/lib/content-space-editor-outline.ts
git rm src/features/content-space/lib/content-space-editor-outline.test.ts
```

若你发现还有别处复用，则保留文件，但要把 `ContentEditorShell` 对它们的 import 删掉。

- [ ] **Step 2: 精简右栏顶部结构**

在 `src/components/admin/content-editor-shell.tsx` 中删除：

- `ChevronLeft`
- `ChevronRight`
- `buildContentSpaceEditorNavigation`
- `buildContentSpaceEditorOutline`
- `上一篇 / 下一篇`
- `当前分支目录`

顶部仅保留：

```tsx
<div className="border-b bg-muted/20 px-6 py-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
        <FolderKanban className="size-3.5" />
        {activeTopic?.name ?? "未归属专题"}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
        <Layers3 className="size-3.5" />
        {activeSubtopic?.name ?? "未归属子专题"}
      </span>
    </div>

    {(activeSubtopic || activeTopic) && selectedPost ? (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={() => void onReturnToStructure()}
      >
        <ArrowLeft className="size-3.5" />
        返回当前结构
      </Button>
    ) : null}
  </div>
</div>
```

- [ ] **Step 3: 保持空状态文案与新设计一致**

无选中文章时右栏空状态文案改成：

```tsx
<PostsEmptyState
  title="选择一篇文章继续"
  description="第一栏负责结构，第二栏负责文章，右侧专心写作。"
  className="max-w-sm"
  size="lg"
  icon={null}
>
  <Button onClick={() => void onCreateNew()}>新建文档</Button>
</PostsEmptyState>
```

- [ ] **Step 4: 跑测试**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-workspace.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/content-editor-shell.tsx
git commit -m "feat: simplify editor header for focused writing"
```

如果删除了无用 helper，再补：

```bash
git add src/features/content-space/lib
git commit -m "refactor: remove editor branch navigation helpers"
```

---

### Task 5: 调整三栏宽度与移动端容器

**Files:**
- Modify: `src/components/admin/content-space-shell.tsx`
- Modify: `src/components/admin/content-space-sidebar.tsx`
- Modify: `src/components/admin/content-space-context-panel.tsx`

- [ ] **Step 1: 先让桌面端回到真正的三栏**

在 `src/components/admin/content-space-shell.tsx` 中把桌面布局从：

```tsx
<div className="grid min-h-0 flex-1 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
```

改成固定三栏：

```tsx
<div className="grid min-h-0 flex-1 lg:grid-cols-[240px_320px_minmax(0,1fr)] xl:grid-cols-[260px_360px_minmax(0,1fr)]">
```

同时把左栏从独立 block 收进 grid：

```tsx
<div className="hidden min-h-0 border-r lg:block">{sidebar}</div>
```

不要再让左栏占据 grid 外层，否则视觉上还是 2 栏。

- [ ] **Step 2: 改移动端顶部动作**

移动端头部保留：

```tsx
<Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
  <Menu className="size-4" />
  内容库
</Button>
```

右侧动作文案改成：

```tsx
<Button variant="ghost" size="sm" onClick={() => void handleCreateNew()}>
  <LayoutPanelLeft className="size-4" />
  新建文档
</Button>
```

- [ ] **Step 3: 给第二栏和第三栏补最小宽度保护**

避免窄屏下内容挤压失真：

```tsx
<div className="min-h-0 min-w-0 border-r bg-background">
  <ContentSpaceContextPanel ... />
</div>

<div className="min-h-0 min-w-0">
  <ContentEditorShell ... />
</div>
```

- [ ] **Step 4: 跑测试**

Run:

```bash
npm run test -- src/features/content-space/lib/content-space-workspace.test.ts src/features/content-space/lib/content-space-sidebar-state.test.ts src/features/content-space/lib/content-space-context.test.ts src/features/content-space/lib/content-space-view-model.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/content-space-shell.tsx src/components/admin/content-space-sidebar.tsx src/components/admin/content-space-context-panel.tsx
git commit -m "feat: restore three-column admin content workspace layout"
```

---

### Task 6: 全量验证并在 Docker 中启动体验环境

**Files:**
- Modify if needed: `docker-compose.yml`
- Verify: `/admin/posts`

- [ ] **Step 1: 跑内容空间相关测试集合**

Run:

```bash
npm run test -- \
  src/features/content-space/lib/content-space-workspace.test.ts \
  src/features/content-space/lib/content-space-sidebar-state.test.ts \
  src/features/content-space/lib/content-space-context.test.ts \
  src/features/content-space/lib/content-space-view-model.test.ts
```

Expected: PASS

如果本轮没有删除对应文件，再追加：

```bash
npm run test -- \
  src/features/content-space/lib/content-space-list-sections.test.ts \
  src/features/content-space/lib/content-space-workflow.test.ts
```

Expected: PASS 或文件已删除

- [ ] **Step 2: 跑 lint**

Run:

```bash
npm run lint
```

Expected: PASS

- [ ] **Step 3: 用 Docker 重建 app**

Run:

```bash
docker compose up -d --build app
```

Expected: `blog-app` 重建成功并处于 `running` 状态

- [ ] **Step 4: 检查容器状态**

Run:

```bash
docker compose ps
```

Expected: `blog-postgres` healthy，`blog-app` running

- [ ] **Step 5: 在浏览器验证关键路径**

手动验证：

1. 打开 `http://localhost:3000/admin/posts`
2. 第一栏可见状态切换和文件夹树
3. 第二栏有 `新建文档 / 搜索 / 排序`
4. 第三栏顶部不再显示 `上一篇 / 下一篇`
5. 第三栏顶部不再显示 `当前分支目录`
6. 点击文件夹、子专题、文章后上下文切换正常

- [ ] **Step 6: Commit**

```bash
git add src/components/admin src/features/content-space/lib
git commit -m "feat: ship admin content workspace v2 layout"
```

---

## Spec Coverage Self-Review

- 第一栏切换组件、文件夹树、添加文件夹：Task 1
- 第二栏轻量头部、文章数量、新建文档、搜索、排序、列表：Task 2 + Task 3
- 第三栏纯编辑器、面包屑、返回当前结构：Task 4
- 三栏整体宽度和移动端容器：Task 5
- Docker 验证与体验环境：Task 6

没有发现未覆盖的 spec 条目。
