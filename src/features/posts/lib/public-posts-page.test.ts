import assert from "node:assert/strict";
import test from "node:test";
import { createResolvePublicPostsPage } from "./public-posts-page";

test("resolvePublicPostsPage marks invalid page params without querying posts", async () => {
  const result = await createResolvePublicPostsPage({
    async getPublicPostsPageData() {
      throw new Error("should not be called");
    },
  })({
    page: "0",
  });

  assert.deepEqual(result, {
    posts: [],
    totalPosts: 0,
    totalPages: 1,
    currentPage: 1,
    isValidPage: false,
    isOutOfRange: false,
  });
});

test("resolvePublicPostsPage keeps valid page state and exposes out-of-range flag", async () => {
  const result = await createResolvePublicPostsPage({
    async getPublicPostsPageData() {
      return {
        posts: [],
        totalPosts: 23,
        totalPages: 3,
      };
    },
  })({
    page: "999",
  });

  assert.equal(result.isValidPage, true);
  assert.equal(result.currentPage, 999);
  assert.equal(typeof result.totalPages, "number");
  assert.equal(typeof result.totalPosts, "number");
  assert.equal(Array.isArray(result.posts), true);
  assert.equal(result.isOutOfRange, result.currentPage > result.totalPages);
});
