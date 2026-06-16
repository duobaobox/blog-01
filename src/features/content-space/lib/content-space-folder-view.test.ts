import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSpaceFolderView,
  getFolderById,
} from "./content-space-folder-view";
import type { ContentTreeFolder } from "./content-space-tree";

const tree: ContentTreeFolder[] = [
  {
    id: "folder-1",
    name: "内容系统",
    slug: "content-system",
    postCount: 3,
    posts: [
      {
        id: "post-1",
        title: "第一篇",
        status: "draft",
        updatedAt: "2026-06-13T10:00:00.000Z",
        folderId: "folder-1",
      },
      {
        id: "post-2",
        title: "第二篇",
        status: "published",
        updatedAt: "2026-06-13T11:00:00.000Z",
        folderId: "folder-1",
      },
      {
        id: "post-3",
        title: "第三篇",
        status: "published",
        updatedAt: "2026-06-13T12:00:00.000Z",
        folderId: "folder-1",
      },
    ],
  },
  {
    id: "folder-2",
    name: "工程实践",
    slug: "engineering-practice",
    postCount: 0,
    posts: [],
  },
];

test("buildContentSpaceFolderView summarizes visible folder rows for the sidebar", () => {
  const view = buildContentSpaceFolderView(tree);

  assert.equal(view.length, 2);
  assert.deepEqual(view[0], {
    id: "folder-1",
    name: "内容系统",
    slug: "content-system",
    postCount: 3,
  });
});

test("getFolderById returns the matching folder row", () => {
  assert.equal(getFolderById(tree, "folder-1")?.slug, "content-system");
  assert.equal(getFolderById(tree, "folder-2")?.slug, "engineering-practice");
});

test("getFolderById returns undefined for unknown folders", () => {
  assert.equal(getFolderById(tree, "missing-folder"), undefined);
});
