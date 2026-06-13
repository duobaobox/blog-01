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

const allPosts = [
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

const draftPosts = [
  allPosts[0],
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
    allPosts,
    draftPosts,
    readyToPublishPosts,
    searchResults: [],
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
    allPosts,
    draftPosts,
    readyToPublishPosts,
    searchResults: [],
    requestedPost: allPosts[0],
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
    allPosts,
    draftPosts,
    readyToPublishPosts,
    searchResults: [],
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
    allPosts,
    draftPosts,
    readyToPublishPosts,
    searchResults: [allPosts[0]],
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
    allPosts,
    draftPosts,
    readyToPublishPosts,
    searchResults: [allPosts[0]],
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

test("buildContentSpaceUrl omits entry param when switching from drafts to all", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "drafts",
      folderId: undefined,
      postId: "post-1",
      view: "edit",
      q: "",
    },
    next: {
      entry: "all",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    },
  });

  assert.equal(url, "/admin/posts");
});

test("buildContentSpaceUrl omits entry param when switching from ready to all", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "ready",
      folderId: undefined,
      postId: "post-1",
      view: "edit",
      q: "",
    },
    next: {
      entry: "all",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    },
  });

  assert.equal(url, "/admin/posts");
});
