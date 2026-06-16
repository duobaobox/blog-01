import assert from "node:assert/strict";
import test from "node:test";
import {
  deserializeSavedContentViews,
  MAX_SAVED_CONTENT_VIEWS,
  normalizeSavedContentViewName,
  saveOrReplaceSavedContentView,
  serializeSavedContentViews,
  createSavedContentView,
} from "./content-space-saved-view";
import {
  normalizeContentLibraryFilters,
  parseSavedContentViewInput,
} from "./content-space-saved-view-shared";

test("serializeSavedContentViews writes a versioned JSON payload", () => {
  const views = [
    {
      id: "view-1",
      name: "待补 SEO",
      filters: {
        debt: "missingSeoDescription" as const,
      },
      createdAt: "2026-06-15T10:00:00.000Z",
    },
  ];

  assert.equal(
    serializeSavedContentViews(views),
    JSON.stringify({
      version: 1,
      views,
    }),
  );
});

test("deserializeSavedContentViews restores valid saved views from versioned payload", () => {
  const raw = JSON.stringify([
    {
      id: "legacy-view",
      name: "Legacy",
      filters: {
        status: "draft",
      },
      createdAt: "2026-06-14T10:00:00.000Z",
    },
  ]);

  assert.deepEqual(deserializeSavedContentViews(raw), [
    {
      id: "legacy-view",
      name: "Legacy",
      filters: {
        status: "draft",
      },
      createdAt: "2026-06-14T10:00:00.000Z",
    },
  ]);
});

test("deserializeSavedContentViews restores valid saved views from wrapped payload", () => {
  const raw = JSON.stringify({
    version: 1,
    views: [
      {
        id: "view-1",
        name: "已发布",
        filters: {
          status: "published",
        },
        createdAt: "2026-06-15T10:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(deserializeSavedContentViews(raw), [
    {
      id: "view-1",
      name: "已发布",
      filters: {
        status: "published",
      },
      createdAt: "2026-06-15T10:00:00.000Z",
    },
  ]);

  assert.deepEqual(deserializeSavedContentViews(raw), [
    {
      id: "view-1",
      name: "已发布",
      filters: {
        status: "published",
      },
      createdAt: "2026-06-15T10:00:00.000Z",
    },
  ]);
});

test("normalizeSavedContentViewName collapses whitespace", () => {
  assert.equal(normalizeSavedContentViewName("  待补   SEO   "), "待补 SEO");
});

test("normalizeContentLibraryFilters drops invalid and empty values", () => {
  assert.deepEqual(
    normalizeContentLibraryFilters({
      status: " draft ",
      categoryId: " ",
      tagId: "tag-1",
      debt: "not-real" as never,
    }),
    {
      status: "draft",
      tagId: "tag-1",
    },
  );
});

test("deserializeSavedContentViews ignores invalid payloads", () => {
  assert.deepEqual(deserializeSavedContentViews(""), []);
  assert.deepEqual(deserializeSavedContentViews("{"), []);
  assert.deepEqual(
    deserializeSavedContentViews(JSON.stringify([{ id: 1 }])),
    [],
  );
});

test("createSavedContentView creates a named saved view with timestamps", () => {
  const view = createSavedContentView({
    name: "无标签",
    filters: {
      debt: "untagged",
    },
  });

  assert.equal(view.name, "无标签");
  assert.equal(view.filters.debt, "untagged");
  assert.equal(typeof view.id, "string");
  assert.equal(typeof view.createdAt, "string");
});

test("saveOrReplaceSavedContentView replaces same-name views and enforces a cap", () => {
  const existing = Array.from({ length: MAX_SAVED_CONTENT_VIEWS }, (_, index) => ({
    id: `view-${index}`,
    name: index === 0 ? "待补 SEO" : `视图 ${index}`,
    filters: {
      status: "draft",
    },
    createdAt: `2026-06-15T10:0${index}:00.000Z`,
  }));

  const result = saveOrReplaceSavedContentView(existing, {
    name: "  待补   SEO ",
    filters: {
      debt: "missingSeoTitle",
    },
  });

  assert.equal(result.length, MAX_SAVED_CONTENT_VIEWS);
  assert.equal(result[0]?.name, "待补 SEO");
  assert.equal(result[0]?.filters.debt, "missingSeoTitle");
  assert.equal(
    result.filter((view) => view.name === "待补 SEO").length,
    1,
  );
});

test("parseSavedContentViewInput rejects invalid governance debt filters", () => {
  const formData = new FormData();
  formData.set("name", "待补 SEO");
  formData.set("debt", "not-real");

  assert.throws(
    () => parseSavedContentViewInput(formData),
    /治理视图筛选无效/,
  );
});

test("parseSavedContentViewInput rejects invalid post status filters", () => {
  const formData = new FormData();
  formData.set("name", "状态视图");
  formData.set("status", "invalid-status");

  assert.throws(
    () => parseSavedContentViewInput(formData),
    /文章状态筛选无效/,
  );
});
