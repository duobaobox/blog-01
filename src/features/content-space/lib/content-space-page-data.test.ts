import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdminPostsPageData,
  buildAdminPostsQueryContext,
  parseAdminPostsPageParam,
  parseContentSpaceQueryParam,
  parseContentSpaceSingleParam,
  toWorkspacePostSummary,
} from "./content-space-page-data";
import type { ContentTreeFolder } from "./content-space-tree";
import type { WorkspacePostSummary } from "./content-space-workspace";

function createPost(
  id: string,
  title: string,
  updatedAt: string,
  options?: {
    status?: string;
    folderId?: string;
    folderName?: string;
    folderSlug?: string;
  },
): WorkspacePostSummary {
  return {
    id,
    title,
    status: options?.status ?? "draft",
    updatedAt,
    folder: options?.folderId
      ? {
          id: options.folderId,
          name: options.folderName ?? options.folderId,
          slug: options.folderSlug ?? options.folderId,
        }
      : null,
  };
}

test("content space page helpers normalize query and single params", () => {
  assert.equal(parseAdminPostsPageParam(undefined), 1);
  assert.equal(parseAdminPostsPageParam("3"), 3);
  assert.equal(parseAdminPostsPageParam("invalid"), 1);
  assert.equal(parseContentSpaceQueryParam([" docker ", "ignored"]), "docker");
  assert.equal(parseContentSpaceQueryParam(undefined), "");
  assert.equal(parseContentSpaceSingleParam(["folder-1", "ignored"]), "folder-1");
  assert.equal(parseContentSpaceSingleParam(undefined), undefined);
});

test("toWorkspacePostSummary keeps optional presentation fields stable", () => {
  assert.deepEqual(
    toWorkspacePostSummary({
      id: "post-1",
      title: "Launch Notes",
      status: "draft",
      updatedAt: "2026-06-15T10:00:00.000Z",
      excerpt: "Summary",
      coverImageUrl: "/cover.png",
      seoTitle: null,
      seoDescription: "SEO",
      folder: {
        id: "folder-1",
        name: "Strategy",
        slug: "strategy",
      },
    }),
    {
      id: "post-1",
      title: "Launch Notes",
      status: "draft",
      updatedAt: "2026-06-15T10:00:00.000Z",
      excerpt: "Summary",
      coverImageUrl: "/cover.png",
      seoTitle: null,
      seoDescription: "SEO",
      folder: {
        id: "folder-1",
        name: "Strategy",
        slug: "strategy",
      },
    },
  );
});

test("buildAdminPostsPageData centralizes page params, counts, and resolved state", () => {
  const contentTree: ContentTreeFolder[] = [
    {
      id: "folder-1",
      name: "Strategy",
      slug: "strategy",
      postCount: 1,
      posts: [
        {
          id: "post-1",
          title: "Launch Notes",
          status: "draft",
          updatedAt: "2026-06-15T10:00:00.000Z",
          folderId: "folder-1",
        },
      ],
    },
  ];

  const recentPosts = [
    createPost("post-1", "Launch Notes", "2026-06-15T10:00:00.000Z", {
      folderId: "folder-1",
      folderName: "Strategy",
      folderSlug: "strategy",
    }),
  ];
  const libraryPosts = [
    ...recentPosts,
    createPost("post-2", "Older Notes", "2026-05-01T10:00:00.000Z"),
  ];

  const pageData = buildAdminPostsPageData({
    rawParams: {
      entry: "all",
      folder: ["folder-1"],
      status: ["draft"],
      categoryId: ["category-1"],
      tagId: ["tag-1"],
      debt: ["uncategorized"],
      q: [" launch "],
      view: "edit",
    },
    contentTree,
    libraryPosts,
    libraryPage: 3,
    libraryTotalPages: 6,
    libraryFeedTotalPosts: 18,
    recentPosts,
    recentPage: 2,
    recentTotalPages: 4,
    recentFeedTotalPosts: 11,
    draftPosts: recentPosts,
    readyToPublishPosts: [],
    folderPosts: recentPosts,
    quickEntryCounts: {
      library: 120,
      recent: 12,
      drafts: 7,
      ready: 3,
    },
    searchResults: recentPosts,
  });

  assert.deepEqual(pageData.params, {
    entry: "all",
    folder: "folder-1",
    postId: undefined,
    view: "edit",
    page: "1",
    status: "draft",
    categoryId: "category-1",
    tagId: "tag-1",
    debt: "uncategorized",
    q: "launch",
  });
  assert.equal(pageData.state.entry, "search");
  assert.equal(pageData.state.activeFolder?.id, "folder-1");
  assert.equal(pageData.searchQuery, "launch");
  assert.deepEqual(pageData.libraryFilters, {
    status: "draft",
    categoryId: "category-1",
    tagId: "tag-1",
    debt: "uncategorized",
  });
  assert.equal(pageData.libraryPage, 3);
  assert.equal(pageData.libraryTotalPages, 6);
  assert.equal(pageData.libraryFeedTotalPosts, 18);
  assert.equal(pageData.recentPage, 2);
  assert.equal(pageData.recentTotalPages, 4);
  assert.equal(pageData.recentFeedTotalPosts, 11);
  assert.deepEqual(pageData.feedSummaries, {
    library: {
      totalPosts: 18,
      page: 3,
      totalPages: 6,
    },
    recent: {
      totalPosts: 11,
      page: 2,
      totalPages: 4,
    },
  });
  assert.deepEqual(pageData.quickEntryCounts, {
    library: 120,
    recent: 12,
    drafts: 7,
    ready: 3,
  });
  assert.deepEqual(pageData.contextSummary, {
    contextLabel: "搜索结果",
    hint: "关键词：launch",
    totalCount: 1,
    draftCount: 1,
    reviewCount: 0,
    publishedCount: 0,
    empty: false,
  });
});

test("buildAdminPostsPageData accepts metadata governance debt filters", () => {
  const pageData = buildAdminPostsPageData({
    rawParams: {
      entry: "library",
      debt: ["missingSeoTitle"],
    },
    contentTree: [],
    libraryPosts: [],
    libraryPage: 1,
    libraryTotalPages: 1,
    libraryFeedTotalPosts: 0,
    recentPosts: [],
    recentPage: 1,
    recentTotalPages: 1,
    recentFeedTotalPosts: 0,
    draftPosts: [],
    readyToPublishPosts: [],
    folderPosts: undefined,
    quickEntryCounts: {
      library: 0,
      recent: 0,
      drafts: 0,
      ready: 0,
    },
    searchResults: [],
  });

  assert.deepEqual(pageData.libraryFilters, {
    status: undefined,
    categoryId: undefined,
    tagId: undefined,
    debt: "missingSeoTitle",
  });
  assert.deepEqual(pageData.feedSummaries.library, {
    totalPosts: 0,
    page: 1,
    totalPages: 1,
  });
});

test("buildAdminPostsQueryContext centralizes admin filters and query plan", () => {
  const context = buildAdminPostsQueryContext({
    postId: ["post-1"],
    page: ["4"],
    entry: ["library"],
    folder: ["folder-1"],
    status: ["published"],
    categoryId: ["category-1"],
    tagId: ["tag-1"],
    debt: ["missingSeoDescription"],
    q: [" release "],
    view: ["edit"],
  });

  assert.deepEqual(context.params, {
    entry: "library",
    folder: "folder-1",
    postId: "post-1",
    view: "edit",
    page: "4",
    status: "published",
    categoryId: "category-1",
    tagId: "tag-1",
    debt: "missingSeoDescription",
    q: "release",
  });
  assert.equal(context.requestedPage, 4);
  assert.equal(context.pageTarget, "library");
  assert.deepEqual(context.libraryFilters, {
    status: "published",
    categoryId: "category-1",
    tagId: "tag-1",
    missingCategory: undefined,
    missingTags: undefined,
    missingFolder: undefined,
    missingExcerpt: undefined,
    missingSeoTitle: undefined,
    missingSeoDescription: true,
  });
  assert.deepEqual(context.searchFilters, {
    query: "release",
    take: 20,
    order: "updated",
    folderId: "folder-1",
    status: "published",
    categoryId: "category-1",
    tagId: "tag-1",
    missingCategory: undefined,
    missingTags: undefined,
    missingFolder: undefined,
    missingExcerpt: undefined,
    missingSeoTitle: undefined,
    missingSeoDescription: true,
  });
  assert.equal(context.queryPlan.shouldLoadSearchResults, true);
  assert.equal(context.queryPlan.shouldLoadFolderPostsFromExplicitFolder, false);
});
