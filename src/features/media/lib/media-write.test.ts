import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import { parseMediaFileFormData } from "./media-write";

test("parseMediaFileFormData returns the uploaded file", () => {
  const formData = new FormData();
  const file = new File(["image"], "hero.png", {
    type: "image/png",
  });
  formData.set("file", file);

  assert.equal(parseMediaFileFormData(formData), file);
});

test("parseMediaFileFormData rejects missing file input", () => {
  assert.throws(
    () => parseMediaFileFormData(new FormData()),
    ValidationError,
  );
});

test("parseMediaFileFormData rejects non-file payloads", () => {
  const formData = new FormData();
  formData.set("file", "not-a-file");

  assert.throws(
    () => parseMediaFileFormData(formData),
    ValidationError,
  );
});
