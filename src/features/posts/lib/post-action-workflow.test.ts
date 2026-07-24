import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBulkUpdatePostsWorkflow,
  buildCreateEmptyPostWorkflow,
  buildCreatePostWorkflow,
  buildDeletePostWorkflow,
  buildUpdatePostWorkflow,
} from "./post-action-workflow";

test("buildCreatePostWorkflow refreshes admin only for draft posts", () => {
  assert.deepEqual(
    buildCreatePostWorkflow({
      status: "draft",
      slug: "draft-post",
    }),
    {
      revalidateAdminPosts: true,
      publicPostsToRevalidate: [],
    },
  );
});

test("buildCreatePostWorkflow refreshes public content for published posts", () => {
  assert.deepEqual(
    buildCreatePostWorkflow({
      status: "published",
      slug: "published-post",
    }),
    {
      revalidateAdminPosts: true,
      publicPostsToRevalidate: [
        {
          status: "published",
          slug: "published-post",
        },
      ],
    },
  );
});

test("buildCreateEmptyPostWorkflow only refreshes admin posts", () => {
  assert.deepEqual(buildCreateEmptyPostWorkflow(), {
    revalidateAdminPosts: true,
    publicPostsToRevalidate: [],
  });
});

test("buildUpdatePostWorkflow refreshes both previous and next public surfaces when publishing", () => {
  assert.deepEqual(
    buildUpdatePostWorkflow({
      previousPost: {
        status: "draft",
        slug: "strategy-memo",
        category: { slug: "drafts" },
      },
      nextPost: {
        status: "published",
        slug: "strategy-memo",
        category: { slug: "insights" },
      },
    }),
    {
      revalidateAdminPosts: true,
      publicPostsToRevalidate: [
        {
          status: "draft",
          slug: "strategy-memo",
          category: { slug: "drafts" },
        },
        {
          status: "published",
          slug: "strategy-memo",
          category: { slug: "insights" },
        },
      ],
    },
  );
});

test("buildDeletePostWorkflow skips public refresh for draft deletions", () => {
  assert.deepEqual(
    buildDeletePostWorkflow({
      previousStatus: "draft",
      deletedPost: { slug: "draft-post" },
    }),
    {
      revalidateAdminPosts: true,
      publicPostsToRevalidate: [],
    },
  );
});

test("buildDeletePostWorkflow refreshes public surfaces for published deletions", () => {
  assert.deepEqual(
    buildDeletePostWorkflow({
      previousStatus: "published",
      deletedPost: {
        slug: "public-post",
        category: { slug: "engineering" },
      },
    }),
    {
      revalidateAdminPosts: true,
      publicPostsToRevalidate: [
        {
          slug: "public-post",
          category: { slug: "engineering" },
        },
      ],
    },
  );
});

test("buildBulkUpdatePostsWorkflow refreshes published posts involved in bulk updates", () => {
  assert.deepEqual(
    buildBulkUpdatePostsWorkflow({
      previousPosts: [
        { status: "draft", slug: "draft-a" },
        { status: "published", slug: "published-before" },
      ],
      updatedPosts: [
        { status: "draft", slug: "internal-a" },
        { status: "published", slug: "published-after" },
      ],
    }),
    {
      revalidateAdminPosts: true,
      publicPostsToRevalidate: [
        { status: "published", slug: "published-before" },
        { status: "published", slug: "published-after" },
      ],
    },
  );
});
