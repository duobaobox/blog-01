import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSpaceViewModel,
  type ContentSpaceViewModelInput,
} from "./content-space-view-model";

function createInput(
  overrides?: Partial<ContentSpaceViewModelInput>,
): ContentSpaceViewModelInput {
  return {
    entry: "recent",
    posts: [
      {
        id: "post-1",
        title: "最近更新的文章",
        status: "published",
        updatedAt: "2026-06-13T11:00:00.000Z",
        subtopic: null,
      },
      {
        id: "post-2",
        title: "一篇草稿",
        status: "draft",
        updatedAt: "2026-06-13T10:00:00.000Z",
        subtopic: null,
      },
    ],
    ...overrides,
  };
}

test("buildContentSpaceViewModel uses recency-oriented helper copy for recent view", () => {
  const viewModel = buildContentSpaceViewModel(createInput());

  assert.equal(viewModel.emptyTitle, "还没有最近内容");
  assert.equal(viewModel.sectionTitle, "最近编辑");
  assert.equal(viewModel.emphasis, "继续上次工作");
});

test("buildContentSpaceViewModel changes helper copy for drafts", () => {
  const viewModel = buildContentSpaceViewModel(
    createInput({
      entry: "drafts",
    }),
  );

  assert.equal(viewModel.sectionTitle, "草稿");
  assert.equal(viewModel.emphasis, "优先补全未完成内容");
  assert.equal(viewModel.emptyTitle, "还没有草稿");
});

test("buildContentSpaceViewModel changes helper copy for ready posts", () => {
  const viewModel = buildContentSpaceViewModel(
    createInput({
      entry: "ready",
    }),
  );

  assert.equal(viewModel.sectionTitle, "待发布");
  assert.equal(viewModel.emphasis, "适合做最后确认");
  assert.equal(viewModel.emptyTitle, "还没有待发布内容");
});

test("buildContentSpaceViewModel uses search-specific empty copy", () => {
  const viewModel = buildContentSpaceViewModel(
    createInput({
      entry: "search",
      posts: [],
    }),
  );

  assert.equal(viewModel.sectionTitle, "搜索结果");
  assert.equal(viewModel.emptyTitle, "换个关键词试试");
});
