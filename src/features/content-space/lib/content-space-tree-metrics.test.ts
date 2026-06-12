import assert from "node:assert/strict";
import test from "node:test";
import { buildContentTreeMetrics } from "./content-space-tree-metrics";
import type { ContentTreeTopic } from "./content-space-tree";

const tree: ContentTreeTopic[] = [
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
            title: "A",
            status: "draft",
            updatedAt: "2026-06-13T08:00:00.000Z",
            subtopicId: "subtopic-1",
          },
          {
            id: "post-2",
            title: "B",
            status: "published",
            updatedAt: "2026-06-13T09:00:00.000Z",
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
            id: "post-3",
            title: "C",
            status: "published",
            updatedAt: "2026-06-13T10:00:00.000Z",
            subtopicId: "subtopic-2",
          },
        ],
      },
    ],
  },
];

test("buildContentTreeMetrics aggregates topic counts and last update", () => {
  const metrics = buildContentTreeMetrics(tree);
  const topic = metrics.topicById.get("topic-1");

  assert.ok(topic);
  assert.equal(topic?.totalPosts, 3);
  assert.equal(topic?.draftPosts, 1);
  assert.equal(topic?.publishedPosts, 2);
  assert.equal(topic?.lastUpdatedAt, "2026-06-13T10:00:00.000Z");
});

test("buildContentTreeMetrics aggregates subtopic counts and last update", () => {
  const metrics = buildContentTreeMetrics(tree);
  const subtopic = metrics.subtopicById.get("subtopic-1");

  assert.ok(subtopic);
  assert.equal(subtopic?.totalPosts, 2);
  assert.equal(subtopic?.draftPosts, 1);
  assert.equal(subtopic?.publishedPosts, 1);
  assert.equal(subtopic?.lastUpdatedAt, "2026-06-13T09:00:00.000Z");
});
