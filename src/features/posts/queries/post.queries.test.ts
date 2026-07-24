import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminDashboardPageDataQuery,
  createAdminPostCountsQuery,
  createHomepageFeaturedOrLatestPostsQuery,
  createPublicPostsPageDataQuery,
  projectAdminDashboardStatCards,
  createPublicPostQueries,
} from "./post.queries";

test("getAdminPostCounts keeps snapshot metrics and derived ready count separate", async () => {
  const query = createAdminPostCountsQuery({
    async getAdminPostMetricsSnapshot() {
      return {
        drafts: 4,
        review: 2,
        published: 18,
        archived: 1,
      };
    },
    async findDraftPublishabilityCandidates() {
      return [
        { status: "draft", title: "Ready Draft", contentText: "Body" },
        { status: "draft", title: "", contentText: "" },
      ] as never;
    },
  });

  const result = await query();

  assert.deepEqual(result.snapshot, {
    drafts: 4,
    review: 2,
    published: 18,
    archived: 1,
  });
  assert.deepEqual(result.derived, {
    ready: 3,
  });
  assert.equal(result.ready, 3);
  assert.equal(result.review, 2);
});

test("createAdminPostCountsQuery returns a reusable async query function", async () => {
  const query = createAdminPostCountsQuery({
    async getAdminPostMetricsSnapshot() {
      return {
        drafts: 1,
        review: 0,
        published: 0,
        archived: 0,
      };
    },
    async findDraftPublishabilityCandidates() {
      return [] as never;
    },
  });

  assert.equal(typeof query, "function");
  assert.deepEqual(await query(), {
    snapshot: {
      drafts: 1,
      review: 0,
      published: 0,
      archived: 0,
    },
    derived: {
      ready: 0,
    },
    drafts: 1,
    review: 0,
    ready: 0,
    published: 0,
    archived: 0,
  });
});

test("projectAdminDashboardStatCards builds dashboard card view-models from projections", () => {
  const stats = projectAdminDashboardStatCards({
    overview: {
      published: 18,
      drafts: 4,
      review: 2,
      ready: 3,
      archived: 1,
    },
    taxonomy: {
      categories: 6,
      tags: 11,
    },
  });

  assert.equal(stats.length, 6);
  assert.deepEqual(stats[0], {
    label: "已发布文章",
    value: 18,
    description: "公开可见的文章",
    iconKey: "post",
    href: "/admin/posts",
  });
  assert.deepEqual(stats[3], {
    label: "已归档",
    value: 1,
    description: "已下线但可恢复的文章",
    iconKey: "post",
    href: "/admin/posts?status=archived",
  });
  assert.deepEqual(stats[4], {
    label: "分类",
    value: 6,
    description: "内容分类数量",
    iconKey: "folder",
    href: "/admin/categories",
  });
});

test("createAdminDashboardPageDataQuery aggregates stat cards and recent activity into one dashboard read model", async () => {
  const calls: Array<string> = [];
  const query = createAdminDashboardPageDataQuery({
    async getOverviewStats() {
      calls.push("overview");
      return {
        published: 18,
        drafts: 4,
        review: 2,
        ready: 3,
        archived: 1,
      };
    },
    async getCategories() {
      calls.push("categories");
      return [{ id: "cat-1" }, { id: "cat-2" }] as never;
    },
    async getTags() {
      calls.push("tags");
      return [{ id: "tag-1" }, { id: "tag-2" }, { id: "tag-3" }] as never;
    },
    async getRecentActivity(take) {
      calls.push(`recent:${take}`);
      return [
        {
          id: "log-1",
          operation: "create",
          summary: "创建文章",
          createdAt: "2026-06-15T00:00:00.000Z",
          post: null,
          author: null,
          detail: {
            postIds: [],
            count: 1,
          },
        },
      ];
    },
  });

  const result = await query(5);

  assert.deepEqual(calls.sort(), [
    "categories",
    "overview",
    "recent:5",
    "tags",
  ]);
  assert.equal(result.statCards.length, 6);
  assert.deepEqual(result.statCards[4], {
    label: "分类",
    value: 2,
    description: "内容分类数量",
    iconKey: "folder",
    href: "/admin/categories",
  });
  assert.deepEqual(result.statCards[5], {
    label: "标签",
    value: 3,
    description: "文章标签数量",
    iconKey: "tag",
    href: "/admin/tags",
  });
  assert.deepEqual(result.recentActivity, [
    {
      id: "log-1",
      operation: "create",
      summary: "创建文章",
      createdAt: "2026-06-15T00:00:00.000Z",
      post: null,
      author: null,
      detail: {
        postIds: [],
        count: 1,
      },
    },
  ]);
});

test("createAdminDashboardPageDataQuery short-circuits during production build", async () => {
  const calls: string[] = [];
  const query = createAdminDashboardPageDataQuery({
    isProductionBuildPhase() {
      calls.push("phase");
      return true;
    },
    async getOverviewStats() {
      calls.push("overview");
      return {
        published: 1,
        drafts: 1,
        review: 0,
        ready: 0,
        archived: 0,
      };
    },
    async getCategories() {
      calls.push("categories");
      return [] as never;
    },
    async getTags() {
      calls.push("tags");
      return [] as never;
    },
    async getRecentActivity() {
      calls.push("recent");
      return [];
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["phase"]);
  assert.deepEqual(result, {
    statCards: [],
    recentActivity: [],
  });
});

test("getHomepageFeaturedOrLatestPosts returns featured source when featured posts exist", async () => {
  const calls: Array<unknown> = [];
  const query = createHomepageFeaturedOrLatestPostsQuery(
    {
      async findPublicPostCards(options) {
        calls.push(options);
        return [
          {
            id: "post-1",
            slug: "featured-post",
            title: "Featured Post",
            coverImageUrl: "/media/featured.png",
          },
        ] as never;
      },
    },
    async () => new Map([
      ["/media/featured.png", {
        url: "/media/featured.png",
        width: 1600,
        height: 900,
        alt: "Featured alt",
      }],
    ]),
  );

  const result = await query(3);

  assert.equal(result.source, "featured");
  assert.equal(result.posts.length, 1);
  assert.deepEqual(result.posts[0].coverImage, {
    url: "/media/featured.png",
    width: 1600,
    height: 900,
    alt: "Featured alt",
  });
  assert.deepEqual(calls, [{
    status: "published",
    isFeatured: true,
    order: "published",
    take: 3,
  }]);
});

test("getHomepageFeaturedOrLatestPosts falls back to latest posts when no featured posts exist", async () => {
  const calls: Array<unknown> = [];
  const query = createHomepageFeaturedOrLatestPostsQuery({
    async findPublicPostCards(options) {
      calls.push(options);
      if (calls.length === 1) {
        return [] as never;
      }

      return [
        {
          id: "post-2",
          slug: "latest-post",
          title: "Latest Post",
        },
      ] as never;
    },
  });

  const result = await query(4);

  assert.equal(result.source, "latest");
  assert.equal(result.posts.length, 1);
  assert.deepEqual(calls, [
    {
      status: "published",
      isFeatured: true,
      order: "published",
      take: 4,
    },
    {
      status: "published",
      order: "published",
      take: 4,
    },
  ]);
});

test("public post queries only use published-content repository methods", async () => {
  const calls: Array<{ fn: string; arg?: unknown }> = [];
  const queries = createPublicPostQueries(
    {
      async findPublishedPostBySlug(slug) {
        calls.push({ fn: "findPublishedPostBySlug", arg: slug });
        return {
          slug,
          coverImageUrl: "/media/post.png",
        } as never;
      },
      async findPublishedForFeed(take) {
        calls.push({ fn: "findPublishedForFeed", arg: take });
        return [] as never;
      },
      async findPublishedSlugs() {
        calls.push({ fn: "findPublishedSlugs" });
        return [] as never;
      },
    },
    async () => new Map([
      ["/media/post.png", {
        url: "/media/post.png",
        width: 1200,
        height: 630,
        alt: "SEO cover",
      }],
    ]),
  );

  const post = await queries.getPostBySlug("hello-world");
  await queries.getPublishedForFeed(12);
  await queries.getPublishedSlugs();

  assert.deepEqual(post?.coverImage, {
    url: "/media/post.png",
    width: 1200,
    height: 630,
    alt: "SEO cover",
  });
  assert.deepEqual(calls, [
    { fn: "findPublishedPostBySlug", arg: "hello-world" },
    { fn: "findPublishedForFeed", arg: 12 },
    { fn: "findPublishedSlugs" },
  ]);
});

test("public posts page query resolves cover media metadata for card lists", async () => {
  const query = createPublicPostsPageDataQuery({
    async getPostCount(filters) {
      assert.deepEqual(filters, {
        status: "published",
        categoryId: "cat-1",
        tagId: undefined,
      });
      return 2;
    },
    async findPublicPostCards(options) {
      assert.deepEqual(options, {
        status: "published",
        categoryId: "cat-1",
        tagId: undefined,
        order: "published",
        take: 10,
        skip: 0,
      });
      return [
        {
          id: "post-1",
          slug: "with-cover",
          title: "With cover",
          excerpt: null,
          contentText: "Body",
          coverImageUrl: "/media/cover.png",
          publishedAt: null,
          createdAt: new Date("2026-06-15T00:00:00.000Z"),
          readingTimeMinutes: 5,
          isFeatured: false,
          category: null,
          tags: [],
        },
      ] as never;
    },
    async resolveMediaPresentationMap(urls) {
      assert.deepEqual(urls, ["/media/cover.png"]);
      return new Map([
        ["/media/cover.png", {
          url: "/media/cover.png",
          width: 1280,
          height: 720,
          alt: "Cover alt",
        }],
      ]);
    },
  });

  const result = await query({
    page: 1,
    categoryId: "cat-1",
  });

  assert.equal(result.totalPosts, 2);
  assert.equal(result.totalPages, 1);
  assert.deepEqual(result.posts[0]?.coverImage, {
    url: "/media/cover.png",
    width: 1280,
    height: 720,
    alt: "Cover alt",
  });
});

test("public post queries fall back when the database is unavailable", async () => {
  const unavailable = Object.assign(
    new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    { code: "ECONNREFUSED" },
  );
  const queries = createPublicPostQueries({
    async findPublishedPostBySlug() {
      throw unavailable;
    },
    async findPublishedForFeed() {
      throw unavailable;
    },
    async findPublishedSlugs() {
      throw unavailable;
    },
  });

  assert.equal(await queries.getPostBySlug("hello-world"), null);
  assert.deepEqual(await queries.getPublishedForFeed(5), []);
  assert.deepEqual(await queries.getPublishedSlugs(), []);
});

test("homepage featured query falls back to empty latest state when the database is unavailable", async () => {
  const unavailable = Object.assign(
    new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    { code: "ECONNREFUSED" },
  );
  const query = createHomepageFeaturedOrLatestPostsQuery({
    async findPublicPostCards() {
      throw unavailable;
    },
  });

  const result = await query(3);

  assert.deepEqual(result, {
    posts: [],
    source: "latest",
  });
});

test("public posts page query falls back to an empty page when the database is unavailable", async () => {
  const unavailable = Object.assign(
    new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    { code: "ECONNREFUSED" },
  );
  const query = createPublicPostsPageDataQuery({
    async getPostCount() {
      throw unavailable;
    },
    async findPublicPostCards() {
      throw new Error("should not be called");
    },
    async resolveMediaPresentationMap() {
      throw new Error("should not be called");
    },
  });

  assert.deepEqual(await query({ page: 1 }), {
    posts: [],
    totalPosts: 0,
    totalPages: 1,
  });
});
