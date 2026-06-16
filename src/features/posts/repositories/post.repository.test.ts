import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAdminPostMetricsSnapshotRow,
  getPostOrderBy,
} from "./post.repository";

test("mapAdminPostMetricsSnapshotRow normalizes bigint and number counts", () => {
  assert.deepEqual(
    mapAdminPostMetricsSnapshotRow({
      library: 18n,
      recent: 5n,
      drafts: 7,
      review: 3,
      published: 8n,
      archived: 2n,
      uncategorized: 4n,
      untagged: 6,
      unfiled: 1n,
      missingExcerpt: 9,
      missingSeoTitle: 10n,
      missingSeoDescription: 11,
    }),
    {
      library: 18,
      recent: 5,
      drafts: 7,
      review: 3,
      published: 8,
      archived: 2,
      uncategorized: 4,
      untagged: 6,
      unfiled: 1,
      missingExcerpt: 9,
      missingSeoTitle: 10,
      missingSeoDescription: 11,
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

test("mapAdminPostMetricsSnapshotRow keeps governance counters stable after query rewrites", () => {
  const row = {
    library: 24,
    recent: 10,
    drafts: 3,
    review: 2,
    published: 19,
    archived: 0,
    uncategorized: 4,
    untagged: 6,
    unfiled: 5,
    missingExcerpt: 7,
    missingSeoTitle: 8,
    missingSeoDescription: 9,
  } as const;

  assert.equal(mapAdminPostMetricsSnapshotRow(row).untagged, 6);
  assert.equal(mapAdminPostMetricsSnapshotRow(row).library, 24);
});
