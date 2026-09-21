import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAdminPostMetricsSnapshotRow,
  getPostOrderBy,
  publishedPostDetailSelect,
} from "./post.repository";

test("mapAdminPostMetricsSnapshotRow normalizes status counts", () => {
  assert.deepEqual(
    mapAdminPostMetricsSnapshotRow({
      internal: 7n,
      published: 8n,
    }),
    {
      internal: 7,
      published: 8,
    },
  );
});

test("getPostOrderBy centralizes published, updated, and default sorts", () => {
  assert.deepEqual(getPostOrderBy("published"), [
    { isFeatured: "desc" },
    { publishedAt: "desc" },
    { createdAt: "desc" },
  ]);
  assert.deepEqual(getPostOrderBy("updated"), [
    { updatedAt: "desc" },
    { createdAt: "desc" },
  ]);
  assert.deepEqual(getPostOrderBy(undefined), [{ createdAt: "desc" }]);
});

test("published post detail投影不包含体积最大的 contentJson", () => {
  const select = publishedPostDetailSelect as Record<string, unknown>;

  assert.equal(
    "contentJson" in select,
    false,
    "公开文章详情不应拉取 contentJson：它体积最大且公开渲染只用 contentHtml",
  );
});

test("published post detail投影保留公开文章页渲染所需的字段", () => {
  const select = publishedPostDetailSelect as Record<string, unknown>;

  for (const field of [
    "slug",
    "title",
    "excerpt",
    "contentHtml",
    "contentText",
    "contentToc",
    "status",
    "publishedAt",
    "createdAt",
    "updatedAt",
  ]) {
    assert.equal(select[field], true, `缺少渲染必需字段 ${field}`);
  }

  assert.deepEqual(select.category, {
    select: { id: true, name: true, slug: true },
  });
  assert.deepEqual(select.tags, {
    select: { tag: { select: { id: true, name: true, slug: true, color: true } } },
  });
  assert.deepEqual(select.author, { select: { name: true } });
});
