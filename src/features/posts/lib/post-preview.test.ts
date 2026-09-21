import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPostPreviewText,
  POST_CARD_PREVIEW_LENGTH,
  POST_PREVIEW_MAX_LENGTH,
  resolvePostCardPreview,
} from "./post-preview";

test("buildPostPreviewText keeps a bounded prefix of the materialized text", () => {
  const longText = "字".repeat(POST_PREVIEW_MAX_LENGTH + 50);

  assert.equal(
    buildPostPreviewText(longText)?.length,
    POST_PREVIEW_MAX_LENGTH,
  );
});

test("buildPostPreviewText returns null when there is no text", () => {
  assert.equal(buildPostPreviewText(""), null);
  assert.equal(buildPostPreviewText("   \n\n  "), null);
});

test("buildPostPreviewText trims before slicing", () => {
  assert.equal(buildPostPreviewText("  正文  "), "正文");
});

test("resolvePostCardPreview prefers the author excerpt", () => {
  assert.equal(
    resolvePostCardPreview({ excerpt: "作者摘要", previewText: "物化预览" }),
    "作者摘要",
  );
});

test("resolvePostCardPreview treats a blank excerpt as absent", () => {
  assert.equal(
    resolvePostCardPreview({ excerpt: "   ", previewText: "物化预览" }),
    "物化预览",
  );
});

test("resolvePostCardPreview truncates the materialized preview and marks it", () => {
  const previewText = "字".repeat(POST_PREVIEW_MAX_LENGTH);
  const preview = resolvePostCardPreview({ excerpt: null, previewText });

  assert.equal(preview, `${"字".repeat(POST_CARD_PREVIEW_LENGTH)}...`);
});

test("resolvePostCardPreview does not mark a short preview as truncated", () => {
  assert.equal(
    resolvePostCardPreview({ excerpt: null, previewText: "短正文" }),
    "短正文",
  );
});

test("resolvePostCardPreview returns an empty string when nothing is available", () => {
  assert.equal(resolvePostCardPreview({ excerpt: null, previewText: null }), "");
});
