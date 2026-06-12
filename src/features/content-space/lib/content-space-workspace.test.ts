import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSpaceUrl,
  resolveContentSpaceState,
  type WorkspacePostSummary,
} from "./content-space-workspace";
import type { ContentTreeTopic } from "./content-space-tree";

function createPost(
  id: string,
  title: string,
  updatedAt: string,
  options?: {
    status?: string;
    topicId?: string;
    topicName?: string;
    topicSlug?: string;
    subtopicId?: string;
    subtopicName?: string;
    subtopicSlug?: string;
  },
): WorkspacePostSummary {
  return {
    id,
    title,
    status: options?.status ?? "draft",
    updatedAt,
    subtopic: options?.subtopicId
      ? {
          id: options.subtopicId,
          name: options.subtopicName ?? options.subtopicId,
          slug: options.subtopicSlug ?? options.subtopicId,
          topic: {
            id: options.topicId ?? "topic-1",
            name: options.topicName ?? "专题",
            slug: options.topicSlug ?? "topic",
          },
        }
      : null,
  };
}

const contentTree: ContentTreeTopic[] = [
  {
    id: "topic-1",
    name: "内容系统",
    slug: "content-system",
    subtopics: [
      {
        id: "subtopic-1",
        name: "发布流程",
        slug: "publishing-flow",
        posts: [
          {
            id: "post-1",
            title: "发布前检查清单",
            status: "draft",
            updatedAt: "2026-06-12T08:00:00.000Z",
            subtopicId: "subtopic-1",
          },
        ],
      },
      {
        id: "subtopic-2",
        name: "增长策略",
        slug: "growth-strategy",
        posts: [
          {
            id: "post-2",
            title: "增长飞轮",
            status: "published",
            updatedAt: "2026-06-12T09:00:00.000Z",
            subtopicId: "subtopic-2",
          },
        ],
      },
    ],
  },
  {
    id: "topic-2",
    name: "工程实践",
    slug: "engineering-practice",
    subtopics: [
      {
        id: "subtopic-3",
        name: "Docker 部署",
        slug: "docker-delivery",
        posts: [
          {
            id: "post-3",
            title: "Docker 发布笔记",
            status: "draft",
            updatedAt: "2026-06-12T10:00:00.000Z",
            subtopicId: "subtopic-3",
          },
        ],
      },
    ],
  },
];

const recentEdited = [
  createPost("post-3", "Docker 发布笔记", "2026-06-12T10:00:00.000Z", {
    topicId: "topic-2",
    topicName: "工程实践",
    topicSlug: "engineering-practice",
    subtopicId: "subtopic-3",
    subtopicName: "Docker 部署",
    subtopicSlug: "docker-delivery",
  }),
  createPost("post-2", "增长飞轮", "2026-06-12T09:00:00.000Z", {
    status: "published",
    topicId: "topic-1",
    topicName: "内容系统",
    topicSlug: "content-system",
    subtopicId: "subtopic-2",
    subtopicName: "增长策略",
    subtopicSlug: "growth-strategy",
  }),
];

const draftPosts = [
  recentEdited[0],
  createPost("post-1", "发布前检查清单", "2026-06-12T08:00:00.000Z", {
    topicId: "topic-1",
    topicName: "内容系统",
    topicSlug: "content-system",
    subtopicId: "subtopic-1",
    subtopicName: "发布流程",
    subtopicSlug: "publishing-flow",
  }),
];

const readyToPublishPosts = [draftPosts[1]];

test("resolveContentSpaceState falls back to the first post inside the requested subtopic", () => {
  const state = resolveContentSpaceState({
    params: { subtopic: "subtopic-2" },
    contentTree,
    recentEdited,
    draftPosts,
    readyToPublishPosts,
    searchResults: [],
  });

  assert.equal(state.entry, "subtopic");
  assert.equal(state.activeTopic?.id, "topic-1");
  assert.equal(state.activeSubtopic?.id, "subtopic-2");
  assert.equal(state.selectedPostId, "post-2");
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-2"],
  );
});

test("resolveContentSpaceState restores a post context from the requested post when URL context is missing", () => {
  const state = resolveContentSpaceState({
    params: { postId: "post-3" },
    contentTree,
    recentEdited,
    draftPosts,
    readyToPublishPosts,
    searchResults: [],
    requestedPost: recentEdited[0],
  });

  assert.equal(state.entry, "subtopic");
  assert.equal(state.activeTopic?.id, "topic-2");
  assert.equal(state.activeSubtopic?.id, "subtopic-3");
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
    recentEdited,
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
    recentEdited,
    draftPosts,
    readyToPublishPosts,
    searchResults: [recentEdited[0]],
  });

  assert.equal(state.entry, "search");
  assert.equal(state.searchQuery, "docker");
  assert.equal(state.selectedPostId, "post-3");
  assert.deepEqual(
    state.contextPosts.map((post) => post.id),
    ["post-3"],
  );
});

test("buildContentSpaceUrl rewrites context params when switching from a subtopic to drafts", () => {
  const url = buildContentSpaceUrl("/admin/posts", {
    current: {
      entry: "subtopic",
      topicId: "topic-1",
      subtopicId: "subtopic-2",
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
