import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSpaceListSections,
  type ContentSpaceListSectionInput,
} from "./content-space-list-sections";

function createPosts() {
  return [
    {
      id: "post-1",
      title: "最近更新的已发布内容",
      status: "published",
      updatedAt: "2026-06-13T11:00:00.000Z",
      subtopic: null,
    },
    {
      id: "post-2",
      title: "一篇草稿",
      status: "draft",
      updatedAt: "2026-06-13T10:00:00.000Z",
      subtopic: null,
    },
    {
      id: "post-3",
      title: "另一篇草稿",
      status: "draft",
      updatedAt: "2026-06-13T09:00:00.000Z",
      subtopic: null,
    },
  ];
}

test("buildContentSpaceListSections creates a single recent section", () => {
  const result = buildContentSpaceListSections({
    entry: "recent",
    posts: createPosts(),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.title, "继续写");
  assert.equal(result[0]?.posts.length, 3);
});

test("buildContentSpaceListSections groups drafts by actionability", () => {
  const result = buildContentSpaceListSections({
    entry: "drafts",
    posts: createPosts(),
  });

  assert.equal(result.length, 2);
  assert.equal(result[0]?.title, "优先补全");
  assert.equal(result[0]?.posts.length, 2);
  assert.equal(result[1]?.title, "已发布对照");
  assert.equal(result[1]?.posts.length, 1);
});

test("buildContentSpaceListSections uses a focused review section for ready posts", () => {
  const result = buildContentSpaceListSections({
    entry: "ready",
    posts: createPosts(),
  });

  assert.equal(result.length, 2);
  assert.equal(result[0]?.title, "待确认后发布");
  assert.equal(result[1]?.title, "最近已发布");
});
