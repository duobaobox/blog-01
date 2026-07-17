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
    updatedBy: "user-1",
  };
}

test("draft autosave skips admin and public cache refreshes", async () => {
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
      calls.push("cache:admin");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.updatePost("post-1", createWriteInput("draft"));

  assert.deepEqual(calls, ["service:update"]);
});

test("published autosave refreshes public content without refreshing admin", async () => {
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
      calls.push("cache:admin");
    },
    revalidatePostsContent() {
      calls.push("cache:public");
    },
  });

  await runner.updatePost("post-1", createWriteInput("published"));

  assert.deepEqual(calls, ["service:update", "cache:public"]);
});
