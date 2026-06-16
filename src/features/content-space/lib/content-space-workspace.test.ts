import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSpaceUrl,
  resolveContentSpaceState,
  type WorkspacePostSummary,
} from "./content-space-workspace";
import type { ContentTreeFolder } from "./content-space-tree";

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

const contentTree: ContentTreeFolder[] = [
  {
    id: "folder-1",
    name: "内容系统",
    slug: "content-system",
    postCount: 2,
    posts: [
      {
        id: "post-1",
        title: "发布前检查清单",
        status: "draft",
        updatedAt: "2026-06-12T08:00:00.000Z",
        folderId: "folder-1",
      },
      {
        id: "post-2",
        title: "增长飞轮",
        status: "published",
        updatedAt: "2026-06-12T09:00:00.000Z",
        folderId: "folder-1",
      },
    ],
  },
  {
    id: "folder-2",
    name: "工程实践",
    slug: "engineering-practice",
    postCount: 1,
    posts: [
      {
        id: "post-3",
        title: "Docker 发布笔记",
        status: "draft",
        updatedAt: "2026-06-12T10:00:00.000Z",
        folderId: "folder-2",
      },
    ],
  },
];

const recentPosts = [
  createPost("post-3", "Docker 发布笔记", "2026-06-12T10:00:00.000Z", {
    folderId: "folder-2",
    folderName: "工程实践",
    folderSlug: "engineering-practice",
  }),
  createPost("post-2", "增长飞轮", "2026-06-12T09:00:00.000Z", {
    status: "published",
    folderId: "folder-1",
    folderName: "内容系统",
    folderSlug: "content-system",
  }),
];
const libraryPosts = [
  ...recentPosts,
  createPost("post-4", "更早的历史文章", "2026-05-01T09:00:00.000Z"),
];

const draftPosts = [
  recentPosts[0],
  createPost("post-1", "发布前检查清单", "2026-06-12T08:00:00.000Z", {
    folderId: "folder-1",
    folderName: "内容系统",
    folderSlug: "content-system",
  }),
];

const readyToPublishPosts = [draftPosts[1]];

test("resolveContentSpaceState falls back to the first post inside the requested folder", () => {
  const state = resolveContentSpaceState({
    params: { folder: "folder-1" },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: [
        createPost("post-1", "发布前检查清单", "2026-06-12T08:00:00.000Z", {
          folderId: "folder-1",
          folderName: "内容系统",
          folderSlug: "content-system",
        }),
        recentPosts[1],
      ],
      searchResults: [],
    },
  });

  assert.equal(state.entry, "folder");
  assert.equal(state.activeFolder?.id, "folder-1");
  assert.equal(state.selectedPostId, "post-1");
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-1", "post-2"],
  );
});

test("resolveContentSpaceState restores a post context from the requested post when URL context is missing", () => {
  const state = resolveContentSpaceState({
    params: { postId: "post-3" },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: [recentPosts[0]],
      searchResults: [],
      requestedPost: recentPosts[0],
    },
  });

  assert.equal(state.entry, "folder");
  assert.equal(state.activeFolder?.id, "folder-2");
  assert.equal(state.selectedPostId, "post-3");
});

test("resolveContentSpaceState clears post selection for new view while keeping the active entry", () => {
  const state = resolveContentSpaceState({
    params: {
      entry: "drafts",
      view: "new",
      postId: "post-1",
    },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: undefined,
      searchResults: [],
    },
  });

  assert.equal(state.mode, "new");
  assert.equal(state.entry, "drafts");
  assert.equal(state.selectedPostId, undefined);
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-3", "post-1"],
  );
});

test("resolveContentSpaceState prioritizes search results when a query is present", () => {
  const state = resolveContentSpaceState({
    params: {
      entry: "ready",
      q: "docker",
    },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: undefined,
      searchResults: [recentPosts[0]],
    },
  });

  assert.equal(state.entry, "search");
  assert.equal(state.searchQuery, "docker");
  assert.equal(state.selectedPostId, "post-3");
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-3"],
  );
});

test("resolveContentSpaceState keeps folder context while searching inside a folder", () => {
  const state = resolveContentSpaceState({
    params: {
      folder: "folder-2",
      q: "docker",
    },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: undefined,
      searchResults: [recentPosts[0]],
    },
  });

  assert.equal(state.entry, "search");
  assert.equal(state.activeFolder?.id, "folder-2");
  assert.equal(state.selectedPostId, "post-3");
});

test("buildContentSpaceUrl rewrites context params when switching from a folder to drafts", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "folder",
      folderId: "folder-1",
      postId: "post-2",
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      entry: "drafts",
      postId: undefined,
    },
  });

  assert.equal(url, "/admin/posts?entry=drafts");
});

test("buildContentSpaceUrl clears post selection when submitting a global search from a quick entry", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "drafts",
      folderId: undefined,
      postId: "post-1",
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      q: "docker",
      postId: undefined,
      view: "edit",
    },
  });

  assert.equal(url, "/admin/posts?q=docker");
});

test("buildContentSpaceUrl keeps q and postId when selecting a search result", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "search",
      postId: undefined,
      view: "edit",
      page: undefined,
      q: "docker",
    },
    next: {
      q: "docker",
      postId: "post-3",
      view: "edit",
    },
  });

  assert.equal(url, "/admin/posts?q=docker&postId=post-3");
});

test("buildContentSpaceUrl keeps folder context when searching inside a folder", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "folder",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      q: "docker",
      postId: undefined,
      view: "edit",
    },
  });

  assert.equal(url, "/admin/posts?q=docker&folder=folder-2");
});

test("buildContentSpaceUrl clears the search query when switching to a quick entry", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "search",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
      page: undefined,
      q: "docker",
    },
    next: {
      entry: "drafts",
      folderId: undefined,
      postId: undefined,
      q: "",
    },
  });

  assert.equal(url, "/admin/posts?entry=drafts");
});

test("buildContentSpaceUrl preserves folder context when clearing a folder search", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "search",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
      page: undefined,
      q: "docker",
    },
    next: {
      entry: "folder",
      folderId: "folder-2",
      postId: undefined,
      q: "",
    },
  });

  assert.equal(url, "/admin/posts?folder=folder-2");
});

test("buildContentSpaceUrl keeps folder context when selecting a post from folder results", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "folder",
      folderId: "folder-2",
      postId: undefined,
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      entry: "folder",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
    },
  });

  assert.equal(url, "/admin/posts?folder=folder-2&postId=post-3");
});

test("buildContentSpaceUrl clears q and keeps folder context when opening a post after folder search", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "search",
      folderId: "folder-2",
      postId: undefined,
      view: "edit",
      page: undefined,
      q: "docker",
    },
    next: {
      entry: "folder",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
      q: "",
    },
  });

  assert.equal(url, "/admin/posts?folder=folder-2&postId=post-3");
});

test("buildContentSpaceUrl clears postId and keeps folder context after deleting the selected post", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "folder",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      entry: "folder",
      folderId: "folder-2",
      postId: undefined,
      view: "edit",
      q: "",
    },
  });

  assert.equal(url, "/admin/posts?folder=folder-2");
});

test("buildContentSpaceUrl keeps only the search query while clearing the selected post in search mode", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "search",
      folderId: "folder-2",
      postId: "post-3",
      view: "edit",
      page: undefined,
      q: "docker",
    },
    next: {
      entry: "search",
      folderId: "folder-2",
      postId: undefined,
      view: "edit",
      q: "docker",
    },
  });

  assert.equal(url, "/admin/posts?q=docker");
});

test("buildContentSpaceUrl preserves explicit library entry", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "recent",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 1,
      filters: undefined,
      q: "",
    },
    next: {
      entry: "library",
      page: 2,
      filters: {
        status: "draft",
        categoryId: "category-1",
      },
    },
  });

  assert.equal(url, "/admin/posts?entry=library&page=2&status=draft&categoryId=category-1");
});

test("buildContentSpaceUrl omits entry param when switching from drafts to recent", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "drafts",
      folderId: undefined,
      postId: "post-1",
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      entry: "recent",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    },
  });

  assert.equal(url, "/admin/posts");
});

test("resolveContentSpaceState treats the legacy all entry as library", () => {
  const state = resolveContentSpaceState({
    params: {
      entry: "all",
    },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: undefined,
      searchResults: [],
    },
  });

  assert.equal(state.entry, "library");
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-3", "post-2", "post-4"],
  );
});

test("resolveContentSpaceState returns the library feed when explicitly requested", () => {
  const state = resolveContentSpaceState({
    params: {
      entry: "library",
    },
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts: undefined,
      searchResults: [],
    },
  });

  assert.equal(state.entry, "library");
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-3", "post-2", "post-4"],
  );
});

test("buildContentSpaceUrl omits entry param when switching from ready to recent", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "ready",
      folderId: undefined,
      postId: "post-1",
      view: "edit",
      page: undefined,
      q: "",
    },
    next: {
      entry: "recent",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    },
  });

  assert.equal(url, "/admin/posts");
});

test("buildContentSpaceUrl preserves page for recent pagination and omits the first page", () => {
  const secondPageUrl = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "recent",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 1,
      filters: undefined,
      q: "",
    },
    next: {
      entry: "recent",
      page: 3,
    },
  });

  const firstPageUrl = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "recent",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 3,
      filters: undefined,
      q: "",
    },
    next: {
      entry: "recent",
      page: 1,
    },
  });

  assert.equal(secondPageUrl, "/admin/posts?page=3");
  assert.equal(firstPageUrl, "/admin/posts");
});

test("buildContentSpaceUrl keeps library filters while paging and searching", () => {
  const pagedUrl = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 1,
      filters: {
        status: "published",
        tagId: "tag-9",
      },
      q: "",
    },
    next: {
      entry: "library",
      page: 4,
    },
  });

  const searchUrl = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 2,
      filters: {
        categoryId: "category-3",
      },
      q: "",
    },
    next: {
      entry: "library",
      page: undefined,
      q: "next",
    },
  });

  assert.equal(pagedUrl, "/admin/posts?entry=library&page=4&status=published&tagId=tag-9");
  assert.equal(searchUrl, "/admin/posts?q=next&entry=library&categoryId=category-3");
});

test("buildContentSpaceUrl keeps library debt presets in governance views", () => {
  const debtUrl = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 1,
      filters: {
        debt: "unfiled",
      },
      q: "",
    },
    next: {
      entry: "library",
      page: 2,
    },
  });

  assert.equal(debtUrl, "/admin/posts?entry=library&page=2&debt=unfiled");
});

test("buildContentSpaceUrl preserves metadata debt filters during library search", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: 1,
      filters: {
        debt: "missingExcerpt",
      },
      q: "",
    },
    next: {
      entry: "library",
      q: "seo",
    },
  });

  assert.equal(url, "/admin/posts?q=seo&entry=library&debt=missingExcerpt");
});
