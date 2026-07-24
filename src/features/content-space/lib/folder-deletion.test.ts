import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { assertFolderCanBeDeleted } from "./folder-deletion";

test("空文件夹可以删除", () => {
  assert.doesNotThrow(() => assertFolderCanBeDeleted(0));
});

test("包含草稿、已发布或已归档笔记的文件夹都不能删除", () => {
  assert.throws(
    () => assertFolderCanBeDeleted(1),
    (error) =>
      error instanceof ValidationError &&
      error.message.includes("请先移动这些笔记"),
  );
});
