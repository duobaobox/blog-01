import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentTree,
  type ContentTreeInput,
} from "./content-space-tree";

test("buildContentTree nests posts under subtopics and topics", () => {
  const input: ContentTreeInput = {
    folders: [
      {
        id: "folder-1",
        name: "内容系统",
        slug: "content-system",
        sortOrder: 2,
      },
      {
        id: "folder-2",
        name: "工程实践",
        slug: "engineering-practice",
        sortOrder: 1,
      },
    ],
    posts: [
      {
        id: "post-1",
        title: "第一篇",
        status: "draft",
        updatedAt: "2026-06-12T10:00:00.000Z",
        folderId: "folder-1",
      },
      {
        id: "post-2",
        title: "第二篇",
        status: "published",
        updatedAt: "2026-06-12T12:00:00.000Z",
        folderId: "folder-1",
      },
      {
        id: "post-3",
        title: "第三篇",
        status: "published",
        updatedAt: "2026-06-12T09:00:00.000Z",
        folderId: "folder-2",
      },
    ],
  };

  const result = buildContentTree(input);

  assert.deepEqual(result.map((folder) => folder.slug), [
    "engineering-practice",
    "content-system",
  ]);
  assert.deepEqual(
    result[1]?.posts.map((post) => post.id),
    ["post-2", "post-1"],
  );
});

test("buildContentTree keeps empty folders for creation affordances", () => {
  const input: ContentTreeInput = {
    folders: [
      {
        id: "folder-1",
        name: "内容系统",
        slug: "content-system",
        sortOrder: 1,
      },
    ],
    posts: [],
  };

  const result = buildContentTree(input);

  assert.equal(result.length, 1);
  assert.deepEqual(result[0]?.posts, []);
});
