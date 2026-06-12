import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSpaceEditorNavigation } from "./content-space-editor-navigation";
import type { WorkspacePostSummary } from "./content-space-workspace";

function createPosts(): WorkspacePostSummary[] {
  return [
    {
      id: "post-1",
      title: "第一篇",
      status: "draft",
      updatedAt: "2026-06-13T12:00:00.000Z",
      subtopic: {
        id: "subtopic-1",
        name: "写作流",
        slug: "writing-flow",
        topic: {
          id: "topic-1",
          name: "内容系统",
          slug: "content-system",
        },
      },
    },
    {
      id: "post-2",
      title: "第二篇",
      status: "draft",
      updatedAt: "2026-06-13T11:00:00.000Z",
      subtopic: {
        id: "subtopic-1",
        name: "写作流",
        slug: "writing-flow",
        topic: {
          id: "topic-1",
          name: "内容系统",
          slug: "content-system",
        },
      },
    },
    {
      id: "post-3",
      title: "第三篇",
      status: "published",
      updatedAt: "2026-06-13T10:00:00.000Z",
      subtopic: {
        id: "subtopic-1",
        name: "写作流",
        slug: "writing-flow",
        topic: {
          id: "topic-1",
          name: "内容系统",
          slug: "content-system",
        },
      },
    },
  ];
}

test("buildContentSpaceEditorNavigation returns previous and next posts around the active post", () => {
  const result = buildContentSpaceEditorNavigation({
    contextPosts: createPosts(),
    selectedPostId: "post-2",
  });

  assert.equal(result.previousPost?.id, "post-1");
  assert.equal(result.previousPost?.title, "第一篇");
  assert.equal(result.nextPost?.id, "post-3");
  assert.equal(result.nextPost?.title, "第三篇");
});

test("buildContentSpaceEditorNavigation omits previous at the beginning of the list", () => {
  const result = buildContentSpaceEditorNavigation({
    contextPosts: createPosts(),
    selectedPostId: "post-1",
  });

  assert.equal(result.previousPost, undefined);
  assert.equal(result.nextPost?.id, "post-2");
});

test("buildContentSpaceEditorNavigation falls back cleanly when the selected post is missing", () => {
  const result = buildContentSpaceEditorNavigation({
    contextPosts: createPosts(),
    selectedPostId: "missing",
  });

  assert.deepEqual(result, {});
});
