import assert from "node:assert/strict";
import test from "node:test";
import { createAdminPostsPageDataQuery } from "./content-space.query";

function createWorkspacePostSummary(
  id: string,
  title: string,
  options?: {
    status?: string;
    folder?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    updatedAt?: string;
  },
) {
  return {
    id,
    title,
    status: options?.status ?? "draft",
    updatedAt: options?.updatedAt ?? "2026-06-15T10:00:00.000Z",
    folder: options?.folder ?? null,
  };
}

function createSelectedPost(
  id: string,
  title: string,
  options?: {
    status?: string;
    folder?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  },
) {
  return {
    id,
    title,
    slug: `${id}-slug`,
    excerpt: null,
    contentJson: {},
    contentText: `${title} body`,
    status: options?.status ?? "draft",
    categoryId: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    isFeatured: false,
    publishedAt: null,
    updatedAt: "2026-06-15T10:00:00.000Z",
    readingTimeMinutes: 1,
    wordCount: 120,
    tags: [],
    coverImageUrl: null,
    folder: options?.folder ?? null,
  };
}

test("createAdminPostsPageDataQuery reuses requested post context and avoids duplicate selected-post fetch", async () => {
  const calls: string[] = [];
  const query = createAdminPostsPageDataQuery({
    async getAdminSessionIdentity() {
      calls.push("session");
      return {
        id: "admin-1",
        name: "Duobao",
        role: "admin",
      };
    },
    async getContentTree() {
      calls.push("tree");
      return [];
    },
    async getAdminRecentPostsPageData() {
      throw new Error("recent feed should not load for default library context");
    },
    async getAdminLibraryPostsPageData() {
      calls.push("library-feed");
      return {
        posts: [],
        currentPage: 1,
        totalPosts: 0,
        totalPages: 1,
      };
    },
    async getDraftPosts() {
      calls.push("drafts");
      return [];
    },
    async getReadyToPublishPosts() {
      calls.push("ready");
      return [];
    },
    async getAdminQuickEntryCounts() {
      calls.push("counts");
      return {
        library: 10,
        recent: 2,
        drafts: 1,
        ready: 1,
      };
    },
    async getCategories() {
      calls.push("categories");
      return [];
    },
    async getTags() {
      calls.push("tags");
      return [];
    },
    async getSavedContentViews(userId) {
      calls.push(`saved:${userId}`);
      return [];
    },
    async getPostById(postId) {
      calls.push(`post:${postId}`);
      return createSelectedPost(postId, "Launch Notes", {
        folder: {
          id: "folder-1",
          name: "Strategy",
          slug: "strategy",
        },
      }) as never;
    },
    async getPosts() {
      throw new Error("search results should not load without query");
    },
    async getPostsByFolder(folderId) {
      calls.push(`folder:${folderId}`);
      return [
        createWorkspacePostSummary("post-1", "Launch Notes", {
          folder: {
            id: "folder-1",
            name: "Strategy",
            slug: "strategy",
          },
        }),
      ] as never;
    },
  });

  const result = await query({
    postId: "post-1",
    view: "edit",
  });

  assert.equal(result.state.entry, "folder");
  assert.equal(result.state.selectedPostId, "post-1");
  assert.equal(result.selectedPost?.id, "post-1");
  assert.deepEqual(calls.filter((entry) => entry.startsWith("post:")), [
    "post:post-1",
  ]);
  assert.ok(calls.includes("folder:folder-1"));
});

test("createAdminPostsPageDataQuery loads search results and selected post from resolved search context", async () => {
  const calls: string[] = [];
  const query = createAdminPostsPageDataQuery({
    async getAdminSessionIdentity() {
      calls.push("session");
      return {
        id: "admin-1",
        name: "Duobao",
        role: "admin",
      };
    },
    async getContentTree() {
      calls.push("tree");
      return [];
    },
    async getAdminRecentPostsPageData() {
      throw new Error("recent feed should not load for explicit library search");
    },
    async getAdminLibraryPostsPageData() {
      calls.push("library-feed");
      return {
        posts: [
          createWorkspacePostSummary("post-1", "Library Post"),
        ],
        currentPage: 1,
        totalPosts: 1,
        totalPages: 1,
      } as never;
    },
    async getDraftPosts() {
      calls.push("drafts");
      return [];
    },
    async getReadyToPublishPosts() {
      calls.push("ready");
      return [];
    },
    async getAdminQuickEntryCounts() {
      calls.push("counts");
      return {
        library: 8,
        recent: 2,
        drafts: 1,
        ready: 1,
      };
    },
    async getCategories() {
      calls.push("categories");
      return [];
    },
    async getTags() {
      calls.push("tags");
      return [];
    },
    async getSavedContentViews(userId) {
      calls.push(`saved:${userId}`);
      return [];
    },
    async getPostById(postId) {
      calls.push(`post:${postId}`);
      return createSelectedPost(postId, "Search Match") as never;
    },
    async getPosts(filters) {
      calls.push(`search:${filters?.query}`);
      return [
        createWorkspacePostSummary("post-2", "Search Match"),
      ] as never;
    },
    async getPostsByFolder() {
      throw new Error("folder posts should not load during search context");
    },
  });

  const result = await query({
    entry: "library",
    q: "launch",
    postId: "post-2",
    view: "edit",
  });

  assert.equal(result.state.entry, "search");
  assert.equal(result.state.selectedPostId, "post-2");
  assert.equal(result.selectedPost?.id, "post-2");
  assert.ok(calls.includes("search:launch"));
  assert.deepEqual(calls.filter((entry) => entry.startsWith("post:")), [
    "post:post-2",
  ]);
});
