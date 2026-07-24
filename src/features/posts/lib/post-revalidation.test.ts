import assert from "node:assert/strict";
import test from "node:test";
import {
  getPostBulkUpdatePublicRevalidationPosts,
  getPostCreatePublicRevalidationPosts,
  getPostDeletePublicRevalidationPosts,
  getPostUpdatePublicRevalidationPosts,
} from "./post-revalidation";

test("getPostCreatePublicRevalidationPosts skips draft creations", () => {
  assert.deepEqual(
    getPostCreatePublicRevalidationPosts({
      status: "draft",
      slug: "draft-post",
    }),
    [],
  );
});

test("getPostCreatePublicRevalidationPosts refreshes published creations", () => {
  assert.deepEqual(
    getPostCreatePublicRevalidationPosts({
      status: "published",
      slug: "published-post",
    }),
    [{ status: "published", slug: "published-post" }],
  );
});

test("getPostUpdatePublicRevalidationPosts skips draft to draft updates", () => {
  assert.deepEqual(
    getPostUpdatePublicRevalidationPosts({
      previousPost: { status: "draft", slug: "draft-post" },
      nextPost: { status: "draft", slug: "draft-post" },
    }),
    [],
  );
});

test("getPostUpdatePublicRevalidationPosts includes both sides of a publish transition", () => {
  assert.deepEqual(
    getPostUpdatePublicRevalidationPosts({
      previousPost: {
        status: "draft",
        slug: "growth-loop",
        category: { slug: "drafts" },
        tags: [{ tag: { slug: "internal" } }],
      },
      nextPost: {
        status: "published",
        slug: "growth-loop",
        category: { slug: "marketing" },
        tags: [{ tag: { slug: "strategy" } }],
      },
    }),
    [
      {
        status: "draft",
        slug: "growth-loop",
        category: { slug: "drafts" },
        tags: [{ tag: { slug: "internal" } }],
      },
      {
        status: "published",
        slug: "growth-loop",
        category: { slug: "marketing" },
        tags: [{ tag: { slug: "strategy" } }],
      },
    ],
  );
});

test("getPostUpdatePublicRevalidationPosts includes both sides of an unpublish transition", () => {
  assert.deepEqual(
    getPostUpdatePublicRevalidationPosts({
      previousPost: {
        status: "published",
        slug: "roadmap",
        category: { slug: "product" },
      },
      nextPost: {
        status: "draft",
        slug: "roadmap",
        category: { slug: "archive" },
      },
    }),
    [
      {
        status: "published",
        slug: "roadmap",
        category: { slug: "product" },
      },
      {
        status: "draft",
        slug: "roadmap",
        category: { slug: "archive" },
      },
    ],
  );
});

test("getPostDeletePublicRevalidationPosts skips draft deletions", () => {
  assert.deepEqual(
    getPostDeletePublicRevalidationPosts({
      previousStatus: "draft",
      deletedPost: { slug: "draft-post" },
    }),
    [],
  );
});

test("getPostDeletePublicRevalidationPosts refreshes published deletions", () => {
  assert.deepEqual(
    getPostDeletePublicRevalidationPosts({
      previousStatus: "published",
      deletedPost: {
        slug: "public-post",
        category: { slug: "engineering" },
        tags: [{ tag: { slug: "nextjs" } }],
      },
    }),
    [
      {
        slug: "public-post",
        category: { slug: "engineering" },
        tags: [{ tag: { slug: "nextjs" } }],
      },
    ],
  );
});

test("getPostBulkUpdatePublicRevalidationPosts refreshes published posts from both previous and next states", () => {
  assert.deepEqual(
    getPostBulkUpdatePublicRevalidationPosts({
      previousPosts: [
        { status: "draft", slug: "draft-a" },
        { status: "published", slug: "published-before" },
      ],
      nextPosts: [
        { status: "draft", slug: "internal-a" },
        { status: "published", slug: "published-after" },
      ],
    }),
    [
      { status: "published", slug: "published-before" },
      { status: "published", slug: "published-after" },
    ],
  );
});
