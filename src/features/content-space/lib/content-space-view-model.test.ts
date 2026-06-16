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
        folder: null,
      },
      {
        id: "post-2",
        title: "一篇草稿",
        status: "draft",
        updatedAt: "2026-06-13T10:00:00.000Z",
        folder: null,
      },
    ],
    ...overrides,
  };
}

test("buildContentSpaceViewModel uses recent-updates helper copy for recent view", () => {
  const viewModel = buildContentSpaceViewModel(createInput());

  assert.equal(viewModel.emptyTitle, "还没有最近内容");
  assert.equal(viewModel.sectionTitle, "最近更新");
  assert.equal(viewModel.emphasis, "先处理最新变动，再进入具体结构");
});

test("buildContentSpaceViewModel uses all-content helper copy for library view", () => {
  const viewModel = buildContentSpaceViewModel(
    createInput({
      entry: "library",
    }),
  );

  assert.equal(viewModel.sectionTitle, "全部内容");
  assert.equal(viewModel.emphasis, "从完整内容库里整理历史文章和结构");
  assert.equal(viewModel.emptyTitle, "还没有任何内容");
});

test("buildContentSpaceViewModel switches helper copy for governance debt views", () => {
  const viewModel = buildContentSpaceViewModel(
    createInput({
      entry: "library",
      debt: "missingSeoDescription",
    }),
  );

  assert.equal(viewModel.sectionTitle, "缺 SEO 描述");
  assert.equal(viewModel.emphasis, "优先补齐 SEO 描述，提升搜索摘要质量");
  assert.equal(viewModel.emptyTitle, "没有缺 SEO 描述的文章");
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

test("buildContentSpaceViewModel hides contextual helper copy in the compact middle-column header", () => {
  const viewModel = buildContentSpaceViewModel(
    createInput({
      entry: "folder",
    }),
  );

  assert.equal(viewModel.showContextHint, false);
  assert.equal(viewModel.showContextPath, false);
});
