import assert from "node:assert/strict";
import test from "node:test";
import {
  areMediaReferenceSetsEqual,
  areStringSetsEqual,
  hasPostContentChanged,
  shouldLogPostUpdate,
} from "./post-save-plan";

test("content comparison ignores server-managed heading ids", () => {
  const previous = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2, id: "server-generated" },
        content: [{ type: "text", text: "标题" }],
      },
    ],
  };
  const next = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "标题" }],
      },
    ],
  };

  assert.equal(hasPostContentChanged(previous, next), false);
});

test("content comparison detects text and formatting changes", () => {
  const previous = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "旧正文" }] }],
  };
  const next = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [{ type: "text", text: "新正文" }],
      },
    ],
  };

  assert.equal(hasPostContentChanged(previous, next), true);
});

test("tag and media comparisons are order independent", () => {
  assert.equal(areStringSetsEqual(["tag-1", "tag-2"], ["tag-2", "tag-1"]), true);
  assert.equal(
    areMediaReferenceSetsEqual(
      [
        { mediaId: "media-1", usage: "content" },
        { mediaId: "media-2", usage: "cover" },
      ],
      [
        { mediaId: "media-2", usage: "cover" },
        { mediaId: "media-1", usage: "content" },
      ],
    ),
    true,
  );
});

test("autosave skips routine logs but status changes remain auditable", () => {
  assert.equal(
    shouldLogPostUpdate({
      saveIntent: "autosave",
      previousStatus: "draft",
      nextStatus: "draft",
    }),
    false,
  );
  assert.equal(
    shouldLogPostUpdate({
      saveIntent: "autosave",
      previousStatus: "draft",
      nextStatus: "published",
    }),
    true,
  );
  assert.equal(
    shouldLogPostUpdate({
      saveIntent: "manual",
      previousStatus: "draft",
      nextStatus: "draft",
    }),
    true,
  );
});
