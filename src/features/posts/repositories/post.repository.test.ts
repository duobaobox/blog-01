import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAdminPostMetricsSnapshotRow,
  getPostOrderBy,
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
