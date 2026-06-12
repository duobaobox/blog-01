import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentContextSummary,
  type ContentContextInput,
} from "./content-space-context";

function createInput(
  overrides?: Partial<ContentContextInput>,
): ContentContextInput {
  return {
    entry: "subtopic",
    topicName: "工程实践",
    subtopicName: "Docker 部署",
    searchQuery: "",
    posts: [
      {
        id: "post-1",
        title: "A",
        status: "draft",
        updatedAt: "2026-06-13T10:00:00.000Z",
        subtopic: {
          id: "subtopic-1",
          name: "Docker 部署",
          slug: "docker-delivery",
          topic: {
            id: "topic-1",
            name: "工程实践",
            slug: "engineering-practice",
          },
        },
      },
      {
        id: "post-2",
        title: "B",
        status: "published",
        updatedAt: "2026-06-13T11:00:00.000Z",
        subtopic: {
          id: "subtopic-1",
          name: "Docker 部署",
          slug: "docker-delivery",
          topic: {
            id: "topic-1",
            name: "工程实践",
            slug: "engineering-practice",
          },
        },
      },
    ],
    ...overrides,
  };
}

test("buildContentContextSummary counts drafts and published posts", () => {
  const summary = buildContentContextSummary(createInput());

  assert.equal(summary.totalCount, 2);
  assert.equal(summary.draftCount, 1);
  assert.equal(summary.publishedCount, 1);
  assert.equal(summary.empty, false);
});

test("buildContentContextSummary produces contextual label for search views", () => {
  const summary = buildContentContextSummary(
    createInput({
      entry: "search",
      searchQuery: "docker",
      topicName: undefined,
      subtopicName: undefined,
    }),
  );

  assert.equal(summary.contextLabel, "搜索结果");
  assert.equal(summary.hint, "关键词：docker");
});

test("buildContentContextSummary treats empty panels as empty state", () => {
  const summary = buildContentContextSummary(
    createInput({
      posts: [],
      entry: "drafts",
      topicName: undefined,
      subtopicName: undefined,
    }),
  );

  assert.equal(summary.empty, true);
  assert.equal(summary.totalCount, 0);
  assert.equal(summary.contextLabel, "草稿箱");
});
