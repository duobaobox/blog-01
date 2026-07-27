import assert from "node:assert/strict";
import test from "node:test";
import { createPostActionRunner } from "./post-action-runner";

test("post action runner refreshes admin only for draft creations", async () => {
  const calls: string[] = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        calls.push("service:create");
        return { status: "draft", slug: "draft-post" };
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        throw new Error("not used");
      },
      async deletePost() {
        throw new Error("not used");
      },
      async applyBulkAction() {
        throw new Error("not used");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.createPost({
    title: "Draft Post",
    contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    excerpt: null,
    coverImageUrl: null,
    categoryId: null,
    folderId: null,
    status: "draft",
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    isFeatured: false,
    tagIds: [],
    createdBy: "user-1",
  });

  assert.deepEqual(calls, ["service:create", "cache:admin"]);
});

test("post action runner refreshes admin and public content for published updates", async () => {
  const calls: string[] = [];
  const publicPayloads: Array<unknown> = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        throw new Error("not used");
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        calls.push("service:update");
        return {
          previousPost: {
            status: "draft",
            slug: "growth-loop",
            category: { slug: "drafts" },
          },
          post: {
            status: "published",
            slug: "growth-loop",
            category: { slug: "marketing" },
          },
        };
      },
      async deletePost() {
        throw new Error("not used");
      },
      async applyBulkAction() {
        throw new Error("not used");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent(posts) {
      calls.push("cache:public");
      publicPayloads.push(posts);
    },
  });

  await runner.updatePost("post-1", {
    title: "Growth Loop",
    contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    excerpt: null,
    coverImageUrl: null,
    categoryId: null,
    folderId: null,
    status: "published",
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    isFeatured: false,
    tagIds: [],
    updatedBy: "user-1",
  });

  assert.deepEqual(calls, ["service:update", "cache:admin", "cache:public"]);
  assert.deepEqual(publicPayloads, [
    [
      {
        status: "draft",
        slug: "growth-loop",
        category: { slug: "drafts" },
      },
      {
        status: "published",
        slug: "growth-loop",
        category: { slug: "marketing" },
      },
    ],
  ]);
});

test("post action runner skips public refresh for internal deletions", async () => {
  const calls: string[] = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        throw new Error("not used");
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        throw new Error("not used");
      },
      async deletePost() {
        calls.push("service:delete");
        return {
          previousStatus: "draft",
          post: { status: "draft", slug: "draft-post" },
        };
      },
      async applyBulkAction() {
        throw new Error("not used");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.deletePost({
    id: "post-1",
    deletedBy: "user-1",
  });

  assert.deepEqual(calls, ["service:delete", "cache:admin"]);
});

test("post action runner refreshes public content for published deletions", async () => {
  const calls: string[] = [];
  const publicPayloads: Array<unknown> = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        throw new Error("not used");
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        throw new Error("not used");
      },
      async deletePost() {
        calls.push("service:delete");
        return {
          previousStatus: "published",
          post: {
            status: "published",
            slug: "published-post",
            category: { slug: "notes" },
          },
        };
      },
      async applyBulkAction() {
        throw new Error("not used");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent(posts) {
      calls.push("cache:public");
      publicPayloads.push(posts);
    },
  });

  await runner.deletePost({
    id: "post-2",
    deletedBy: "user-1",
  });

  assert.deepEqual(calls, ["service:delete", "cache:admin", "cache:public"]);
  assert.deepEqual(publicPayloads, [
    [
      {
        status: "published",
        slug: "published-post",
        category: { slug: "notes" },
      },
    ],
  ]);
});

test("post action runner refreshes admin and published content for bulk updates", async () => {
  const calls: string[] = [];
  const publicPayloads: Array<unknown> = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        throw new Error("not used");
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        throw new Error("not used");
      },
      async deletePost() {
        throw new Error("not used");
      },
      async applyBulkAction() {
        calls.push("service:bulk");
        return {
          previousPosts: [
            { status: "draft", slug: "draft-a" },
            { status: "published", slug: "published-before" },
          ],
          updatedPosts: [
            { status: "draft", slug: "internal-a" },
            { status: "published", slug: "published-after" },
          ],
        };
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent(posts) {
      calls.push("cache:public");
      publicPayloads.push(posts);
    },
  });

  await runner.applyBulkAction({
    type: "setStatus",
    postIds: ["post-1", "post-2"],
    status: "draft",
    updatedBy: "user-1",
  });

  assert.deepEqual(calls, ["service:bulk", "cache:admin", "cache:public"]);
  assert.deepEqual(publicPayloads, [
    [
      { status: "published", slug: "published-before" },
      { status: "published", slug: "published-after" },
    ],
  ]);
});

test("post action runner accepts tag replacement bulk actions", async () => {
  const calls: string[] = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        throw new Error("not used");
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        throw new Error("not used");
      },
      async deletePost() {
        throw new Error("not used");
      },
      async applyBulkAction(input) {
        calls.push(input.type);
        return {
          previousPosts: [],
          updatedPosts: [],
        };
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.applyBulkAction({
    type: "replaceTags",
    postIds: ["post-1"],
    tagIds: ["tag-1", "tag-2"],
    updatedBy: "user-1",
  });

  assert.deepEqual(calls, ["replaceTags", "cache:admin"]);
});

test("post action runner accepts additive and subtractive tag bulk actions", async () => {
  const calls: string[] = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        throw new Error("not used");
      },
      async createEmptyPost() {
        throw new Error("not used");
      },
      async updatePost() {
        throw new Error("not used");
      },
      async deletePost() {
        throw new Error("not used");
      },
      async applyBulkAction(input) {
        calls.push(input.type);
        return {
          previousPosts: [],
          updatedPosts: [],
        };
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.applyBulkAction({
    type: "appendTags",
    postIds: ["post-1"],
    tagIds: ["tag-1"],
    updatedBy: "user-1",
  });
  await runner.applyBulkAction({
    type: "removeTags",
    postIds: ["post-1"],
    tagIds: ["tag-1"],
    updatedBy: "user-1",
  });

  assert.deepEqual(calls, [
    "appendTags",
    "cache:admin",
    "removeTags",
    "cache:admin",
  ]);
});
