import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { assertCompatibleMediaReplacement } from "./media-replacement";

test("media replacement accepts the same MIME type", () => {
  assert.doesNotThrow(() => {
    assertCompatibleMediaReplacement("image/png", "image/png");
  });
});

test("media replacement rejects a different MIME type", () => {
  assert.throws(
    () => assertCompatibleMediaReplacement("image/jpeg", "image/png"),
    (error) =>
      error instanceof ValidationError &&
      error.message.includes("必须与原文件类型一致"),
  );
});

test("media replacement rejects an empty MIME type", () => {
  assert.throws(
    () => assertCompatibleMediaReplacement("image/jpeg", ""),
    ValidationError,
  );
});
