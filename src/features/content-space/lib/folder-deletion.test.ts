import assert from "node:assert/strict";
import test from "node:test";
import { getFolderDeletionPublicPosts } from "./folder-deletion";

test("文件夹删除只刷新其中已发布文章的公开页面", () => {
  const posts = [
    { status: "draft", slug: "private-note" },
    { status: "published", slug: "public-post" },
  ];

  assert.deepEqual(getFolderDeletionPublicPosts(posts), [
    { status: "published", slug: "public-post" },
  ]);
});

test("删除空文件夹不需要刷新公开页面", () => {
  assert.deepEqual(getFolderDeletionPublicPosts([]), []);
});
