import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { parsePostBulkActionFormData } from "./post-bulk-action";

function createFolderAction(folderId?: string) {
  const formData = new FormData();
  formData.set("type", "setFolder");
  formData.append("postIds", "post-1");
  if (folderId !== undefined) {
    formData.set("folderId", folderId);
  }
  return formData;
}

test("批量移动必须选择目标文件夹", () => {
  assert.throws(
    () => parsePostBulkActionFormData(createFolderAction()),
    ValidationError,
  );
  assert.throws(
    () => parsePostBulkActionFormData(createFolderAction("__none__")),
    ValidationError,
  );
});

test("批量移动保留明确的目标文件夹", () => {
  assert.deepEqual(
    parsePostBulkActionFormData(createFolderAction("folder-1")),
    {
      type: "setFolder",
      postIds: ["post-1"],
      folderId: "folder-1",
    },
  );
});
