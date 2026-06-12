import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentTree,
  type ContentTreeInput,
} from "./content-space-tree";

test("buildContentTree nests posts under subtopics and topics", () => {
  const input: ContentTreeInput = {
    topics: [
      {
        id: "topic-1",
        name: "内容系统",
        slug: "content-system",
        sortOrder: 2,
      },
      {
        id: "topic-2",
        name: "工程实践",
        slug: "engineering-practice",
        sortOrder: 1,
      },
    ],
    subtopics: [
      {
        id: "subtopic-1",
        topicId: "topic-1",
        name: "发布流程",
        slug: "publishing-flow",
        sortOrder: 2,
      },
      {
        id: "subtopic-2",
        topicId: "topic-1",
        name: "增长策略",
        slug: "growth-strategy",
        sortOrder: 1,
      },
      {
        id: "subtopic-3",
        topicId: "topic-2",
        name: "Docker 部署",
        slug: "docker-delivery",
        sortOrder: 1,
      },
    ],
    posts: [
      {
        id: "post-1",
        title: "第一篇",
        status: "draft",
        updatedAt: "2026-06-12T10:00:00.000Z",
        subtopicId: "subtopic-1",
      },
      {
        id: "post-2",
        title: "第二篇",
        status: "published",
        updatedAt: "2026-06-12T12:00:00.000Z",
        subtopicId: "subtopic-1",
      },
      {
        id: "post-3",
        title: "第三篇",
        status: "published",
        updatedAt: "2026-06-12T09:00:00.000Z",
        subtopicId: "subtopic-3",
      },
    ],
  };

  const result = buildContentTree(input);

  assert.deepEqual(result.map((topic) => topic.slug), [
    "engineering-practice",
    "content-system",
  ]);
  assert.deepEqual(result[1]?.subtopics.map((subtopic) => subtopic.slug), [
    "growth-strategy",
    "publishing-flow",
  ]);
  assert.deepEqual(
    result[1]?.subtopics[1]?.posts.map((post) => post.id),
    ["post-2", "post-1"],
  );
});

test("buildContentTree keeps empty subtopics for creation affordances", () => {
  const input: ContentTreeInput = {
    topics: [
      {
        id: "topic-1",
        name: "内容系统",
        slug: "content-system",
        sortOrder: 1,
      },
    ],
    subtopics: [
      {
        id: "subtopic-1",
        topicId: "topic-1",
        name: "发布流程",
        slug: "publishing-flow",
        sortOrder: 1,
      },
    ],
    posts: [],
  };

  const result = buildContentTree(input);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.subtopics.length, 1);
  assert.deepEqual(result[0]?.subtopics[0]?.posts, []);
});
