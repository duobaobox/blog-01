import assert from "node:assert/strict";
import test from "node:test";
import { createPostActionRunner } from "./post-action-runner";

function createWriteInput(status: "draft" | "published") {
  return {
    title: "Autosave Post",
    contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    excerpt: null,
    coverImageUrl: null,
    categoryId: null,
    folderId: null,
    status,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    isFeatured: false,
    tagIds: [],
    saveIntent: "autosave" as const,
  };
}

test("first draft autosave invalidates tags without refreshing the admin path", async () => {
  const calls: string[] = [];
  const runner = createPostActionRunner({
    postService: {
      async createPost() {
        calls.push("service:create");
        return { status: "draft", slug: "autosave-post" };
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
      calls.push("cache:admin-path");
    },
    revalidateAdminPostTags() {
      calls.push("cache:admin-tags");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.createPost({
    ...createWriteInput("draft"),
    createdBy: "user-1",
  });

  assert.deepEqual(calls, ["service:create", "cache:admin-tags"]);
});

test("draft autosave invalidates tags without refreshing the admin path", async () => {
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
        calls.push("service:update");
        return {
          previousPost: { status: "draft", slug: "autosave-post" },
          post: { status: "draft", slug: "autosave-post" },
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
      calls.push("cache:admin-path");
    },
    revalidateAdminPostTags() {
      calls.push("cache:admin-tags");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.updatePost("post-1", {
    ...createWriteInput("draft"),
    updatedBy: "user-1",
  });

  assert.deepEqual(calls, ["service:update", "cache:admin-tags"]);
});

test("published autosave refreshes public content without refreshing admin path", async () => {
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
        calls.push("service:update");
        return {
          previousPost: { status: "published", slug: "autosave-post" },
          post: { status: "published", slug: "autosave-post" },
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
      calls.push("cache:admin-path");
    },
    revalidateAdminPostTags() {
      calls.push("cache:admin-tags");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.updatePost("post-1", {
    ...createWriteInput("published"),
    updatedBy: "user-1",
  });

  assert.deepEqual(calls, [
    "service:update",
    "cache:admin-tags",
    "cache:public",
  ]);
});
