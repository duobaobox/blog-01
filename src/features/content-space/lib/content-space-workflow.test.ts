import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSpaceWorkflowModel } from "./content-space-workflow";
import type { WorkspacePostSummary } from "./content-space-workspace";

function createPost(
  overrides?: Partial<WorkspacePostSummary> & {
    excerpt?: string | null;
    coverImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  },
) {
  return {
    id: overrides?.id ?? "post-1",
    title: overrides?.title ?? "一篇文章",
    status: overrides?.status ?? "draft",
    updatedAt: overrides?.updatedAt ?? "2026-06-13T11:00:00.000Z",
    subtopic: overrides?.subtopic ?? null,
    excerpt: overrides?.excerpt ?? null,
    coverImageUrl: overrides?.coverImageUrl ?? null,
    seoTitle: overrides?.seoTitle ?? null,
    seoDescription: overrides?.seoDescription ?? null,
  };
}

test("buildContentSpaceWorkflowModel creates draft workflow cards from writing gaps", () => {
  const result = buildContentSpaceWorkflowModel({
    entry: "drafts",
    posts: [
      createPost({ id: "untitled", title: "" }),
      createPost({ id: "no-excerpt", title: "有标题但没摘要", excerpt: "" }),
      createPost({
        id: "active-writing",
        title: "已开写",
        excerpt: "已经有摘要",
      }),
    ] as WorkspacePostSummary[],
  });

  assert.deepEqual(result.cards, [
    {
      title: "待补标题",
      description: "先把未命名草稿变成可识别主题，后续才方便继续整理。",
      count: 1,
    },
    {
      title: "待补摘要",
      description: "这些草稿已经有主题，但还缺少摘要，发布判断会比较慢。",
      count: 1,
    },
    {
      title: "继续扩写",
      description: "这些草稿已经具备基本信息，适合直接回到正文继续写。",
      count: 1,
    },
  ]);
});

test("buildContentSpaceWorkflowModel creates ready workflow cards from publish gaps", () => {
  const result = buildContentSpaceWorkflowModel({
    entry: "ready",
    posts: [
      createPost({
        id: "no-cover",
        title: "缺封面",
        excerpt: "有摘要",
        coverImageUrl: "",
        seoTitle: "SEO 标题",
        seoDescription: "SEO 描述",
      }),
      createPost({
        id: "no-seo",
        title: "缺 SEO",
        excerpt: "有摘要",
        coverImageUrl: "https://example.com/cover.png",
        seoTitle: "",
        seoDescription: "",
      }),
      createPost({
        id: "ready",
        title: "可以发布",
        excerpt: "有摘要",
        coverImageUrl: "https://example.com/cover.png",
        seoTitle: "SEO 标题",
        seoDescription: "SEO 描述",
      }),
    ] as WorkspacePostSummary[],
  });

  assert.deepEqual(result.cards, [
    {
      title: "待补封面",
      description: "这些内容已经接近完成，但还缺少首屏封面信号。",
      count: 1,
    },
    {
      title: "待补 SEO",
      description: "正文基本完成，但还没有把搜索摘要和标题整理好。",
      count: 1,
    },
    {
      title: "可以发布",
      description: "这些内容信息完整，可以进入最后检查并决定发布时间。",
      count: 1,
    },
  ]);
});

test("buildContentSpaceWorkflowModel creates structure-oriented cards for topic view", () => {
  const result = buildContentSpaceWorkflowModel({
    entry: "topic",
    posts: [
      createPost({ id: "draft-a", status: "draft", excerpt: "" }),
      createPost({ id: "draft-b", status: "draft", excerpt: "摘要" }),
      createPost({ id: "published-a", status: "published", excerpt: "摘要" }),
    ] as WorkspacePostSummary[],
  });

  assert.deepEqual(result.cards, [
    {
      title: "待完善草稿",
      description: "先补齐这个专题里仍在写作中的内容，避免结构展开后仍有大片空缺。",
      count: 2,
    },
    {
      title: "已发布基线",
      description: "这些文章已经公开，适合拿来对照专题是否覆盖完整。",
      count: 1,
    },
  ]);
});
