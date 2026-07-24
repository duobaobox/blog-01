import assert from "node:assert/strict";
import test from "node:test";
import type { FindPostsOptions } from "@/features/posts/repositories/post.repository";
import { createAdminPostsPageDataQuery } from "./content-space.query";

const FOLDER_ONE = {
  id: "folder-1",
  name: "产品",
  slug: "product",
};

const FOLDER_TWO = {
  id: "folder-2",
  name: "技术",
  slug: "engineering",
};

function createTree() {
  return [
    { ...FOLDER_ONE, postCount: 2, posts: [] },
    { ...FOLDER_TWO, postCount: 1, posts: [] },
  ];
}

function createPost(
  id: string,
  title: string,
  status: "draft" | "published",
  folder = FOLDER_ONE,
) {
  return {
    id,
    title,
    slug: `${id}-slug`,
    excerpt: `${title} 摘要`,
    contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    contentText: `${title} 正文`,
    status,
    categoryId: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    isFeatured: false,
    publishedAt: status === "published" ? "2026-07-01T10:00:00.000Z" : null,
    updatedAt: "2026-07-15T10:00:00.000Z",
    readingTimeMinutes: 1,
    wordCount: 120,
    tags: [],
    coverImageUrl: null,
    folder,
  };
}

function createDependencies(options?: {
  requestedPost?: ReturnType<typeof createPost>;
  posts?: ReturnType<typeof createPost>[];
  calls?: string[];
}) {
  const calls = options?.calls ?? [];
  const posts = options?.posts ?? [
    createPost("internal-1", "产品笔记", "draft"),
    createPost("published-1", "产品公告", "published"),
  ];

  return {
    calls,
    dependencies: {
      async getContentTree() {
        calls.push("tree");
        return createTree();
      },
      async getCategories() {
        return [];
      },
      async getTags() {
        return [];
      },
      async getPostById(postId: string) {
        calls.push(`post:${postId}`);
        return (
          options?.requestedPost?.id === postId
            ? options.requestedPost
            : posts.find((post) => post.id === postId)
        ) as never;
      },
      async getPosts(filters?: FindPostsOptions) {
        calls.push(`folder:${filters?.folderId}:${filters?.order}`);
        return posts.filter((post) => post.folder.id === filters?.folderId) as never;
      },
    },
  };
}

test("文章工作台默认进入第一个文件夹并统计当前文件夹状态", async () => {
  const { dependencies, calls } = createDependencies();
  const query = createAdminPostsPageDataQuery(dependencies);

  const result = await query({});

  assert.equal(result.activeFolder?.id, FOLDER_ONE.id);
  assert.deepEqual(result.folderStatusCounts, {
    all: 2,
    internal: 1,
    published: 1,
  });
  assert.deepEqual(
    result.contextPosts.map((post) => post.id),
    ["internal-1", "published-1"],
  );
  assert.ok(calls.includes("folder:folder-1:created"));
  assert.equal(calls.some((call) => call.includes("folder-2")), false);
});

test("状态和搜索只筛选当前文件夹文章", async () => {
  const { dependencies, calls } = createDependencies();
  const query = createAdminPostsPageDataQuery(dependencies);

  const result = await query({
    folder: FOLDER_ONE.id,
    status: "internal",
    q: "产品",
  });

  assert.equal(result.statusFilter, "internal");
  assert.deepEqual(result.contextPosts.map((post) => post.id), ["internal-1"]);
  assert.equal(result.selectedPostId, "internal-1");
  assert.ok(calls.includes("folder:folder-1:created"));
});

test("通过文章链接进入时恢复文章所属文件夹而不是全局列表", async () => {
  const requestedPost = createPost(
    "engineering-1",
    "工程记录",
    "draft",
    FOLDER_TWO,
  );
  const { dependencies, calls } = createDependencies({
    requestedPost,
    posts: [requestedPost],
  });
  const query = createAdminPostsPageDataQuery(dependencies);

  const result = await query({ postId: requestedPost.id });

  assert.equal(result.activeFolder?.id, FOLDER_TWO.id);
  assert.equal(result.selectedPostId, requestedPost.id);
  assert.equal(result.selectedPost?.id, requestedPost.id);
  assert.ok(calls.includes("folder:folder-2:created"));
});

test("旧草稿链接统一显示为内部内容", async () => {
  const { dependencies } = createDependencies();
  const query = createAdminPostsPageDataQuery(dependencies);

  const result = await query({
    folder: FOLDER_ONE.id,
    status: "draft",
  });

  assert.equal(result.statusFilter, "internal");
  assert.deepEqual(result.contextPosts.map((post) => post.id), ["internal-1"]);
});
