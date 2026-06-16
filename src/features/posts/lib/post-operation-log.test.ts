import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPostOperationSummary,
  getPostBulkOperationType,
} from "./post-operation-log";

test("getPostBulkOperationType maps bulk inputs to audit operation types", () => {
  assert.equal(
    getPostBulkOperationType({
      type: "setStatus",
      postIds: ["post-1"],
      status: "review",
    }),
    "bulkStatus",
  );
  assert.equal(
    getPostBulkOperationType({
      type: "replaceTags",
      postIds: ["post-1"],
      tagIds: ["tag-1"],
    }),
    "bulkReplaceTags",
  );
});

test("buildPostOperationSummary formats single-post and bulk operation copy", () => {
  assert.equal(
    buildPostOperationSummary({
      type: "create",
      title: "发布前检查清单",
    }),
    "创建文章《发布前检查清单》",
  );
  assert.equal(
    buildPostOperationSummary({
      type: "archive",
      title: "旧版本首页复盘",
    }),
    "归档文章《旧版本首页复盘》",
  );
  assert.equal(
    buildPostOperationSummary({
      type: "bulkFolder",
      count: 3,
    }),
    "批量调整 3 篇文章文件夹",
  );
});
