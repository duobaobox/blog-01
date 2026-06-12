import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSpaceEditorOutline } from "./content-space-editor-outline";
import type { WorkspacePostSummary } from "./content-space-workspace";

function createPosts(): WorkspacePostSummary[] {
  return [
    {
      id: "post-1",
      title: "内容策略总览",
      status: "draft",
      updatedAt: "2026-06-13T12:00:00.000Z",
      subtopic: {
        id: "subtopic-1",
        name: "内容结构",
        slug: "content-structure",
        topic: {
          id: "topic-1",
          name: "内容系统",
          slug: "content-system",
        },
      },
    },
    {
      id: "post-2",
      title: "发布流程",
      status: "draft",
      updatedAt: "2026-06-13T11:00:00.000Z",
      subtopic: {
        id: "subtopic-1",
        name: "内容结构",
        slug: "content-structure",
        topic: {
          id: "topic-1",
          name: "内容系统",
          slug: "content-system",
        },
      },
    },
    {
      id: "post-3",
      title: "搜索摘要策略",
      status: "published",
      updatedAt: "2026-06-13T10:00:00.000Z",
      subtopic: {
        id: "subtopic-1",
        name: "内容结构",
        slug: "content-structure",
        topic: {
          id: "topic-1",
          name: "内容系统",
          slug: "content-system",
        },
      },
    },
  ];
}

test("buildContentSpaceEditorOutline returns active position and ordered items for the current branch", () => {
  const outline = buildContentSpaceEditorOutline({
    contextPosts: createPosts(),
    selectedPostId: "post-2",
  });

  assert.equal(outline?.activeIndex, 1);
  assert.equal(outline?.total, 3);
  assert.deepEqual(
    outline?.items.map((item) => item.id),
    ["post-1", "post-2", "post-3"],
  );
});

test("buildContentSpaceEditorOutline returns null when there is no active post in context", () => {
  const outline = buildContentSpaceEditorOutline({
    contextPosts: createPosts(),
    selectedPostId: "missing",
  });

  assert.equal(outline, null);
});
