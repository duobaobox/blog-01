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
    entry: "folder",
    folderName: "工程实践",
    searchQuery: "",
    posts: [
      {
        id: "post-1",
        title: "A",
        status: "draft",
        updatedAt: "2026-06-13T10:00:00.000Z",
        folder: {
          id: "folder-1",
          name: "工程实践",
          slug: "engineering-practice",
        },
      },
      {
        id: "post-2",
        title: "B",
        status: "published",
        updatedAt: "2026-06-13T11:00:00.000Z",
        folder: {
          id: "folder-1",
          name: "工程实践",
          slug: "engineering-practice",
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
  assert.equal(summary.reviewCount, 0);
  assert.equal(summary.publishedCount, 1);
  assert.equal(summary.empty, false);
});

test("buildContentContextSummary counts review posts separately", () => {
  const summary = buildContentContextSummary(
    createInput({
      posts: [
        {
          id: "post-1",
          title: "A",
          status: "review",
          updatedAt: "2026-06-13T10:00:00.000Z",
          folder: {
            id: "folder-1",
            name: "工程实践",
            slug: "engineering-practice",
          },
        },
      ],
    }),
  );

  assert.equal(summary.draftCount, 0);
  assert.equal(summary.reviewCount, 1);
  assert.equal(summary.publishedCount, 0);
});

test("buildContentContextSummary produces contextual label for search views", () => {
  const summary = buildContentContextSummary(
    createInput({
      entry: "search",
      searchQuery: "docker",
      folderName: undefined,
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
      folderName: undefined,
    }),
  );

  assert.equal(summary.empty, true);
  assert.equal(summary.totalCount, 0);
  assert.equal(summary.contextLabel, "草稿箱");
});

test("buildContentContextSummary uses recent-updates copy for recent entry", () => {
  const summary = buildContentContextSummary(
    createInput({
      entry: "recent",
      folderName: undefined,
    }),
  );

  assert.equal(summary.contextLabel, "最近更新");
  assert.equal(summary.hint, "先处理最近更新的内容，再进入具体文件夹继续整理");
});

test("buildContentContextSummary uses library copy for the all-content view", () => {
  const summary = buildContentContextSummary(
    createInput({
      entry: "library",
      folderName: undefined,
    }),
  );

  assert.equal(summary.contextLabel, "全部内容");
  assert.equal(summary.hint, "从完整内容库中查找、筛选和整理历史内容");
});
