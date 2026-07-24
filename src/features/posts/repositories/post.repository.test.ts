import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAdminPostMetricsSnapshotRow,
  getPostOrderBy,
} from "./post.repository";

test("mapAdminPostMetricsSnapshotRow normalizes status counts", () => {
  assert.deepEqual(
    mapAdminPostMetricsSnapshotRow({
      drafts: 7,
      review: 3n,
      published: 8n,
      archived: 2,
    }),
    {
      drafts: 7,
      review: 3,
      published: 8,
      archived: 2,
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
