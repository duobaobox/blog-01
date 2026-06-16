import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { parseFolderWriteFormData } from "./folder-write";

test("parseFolderWriteFormData trims the folder name", () => {
  const formData = new FormData();
  formData.set("name", "  内容系统  ");

  assert.deepEqual(parseFolderWriteFormData(formData), {
    name: "内容系统",
    description: null,
  });
});

test("parseFolderWriteFormData rejects empty folder names", () => {
  const formData = new FormData();
  formData.set("name", "  ");

  assert.throws(() => parseFolderWriteFormData(formData), ValidationError);
});
