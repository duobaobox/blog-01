import assert from "node:assert/strict";
import test from "node:test";
import {
  areMediaReferenceSetsEqual,
  areStringSetsEqual,
  hasPostContentChanged,
  shouldLogPostUpdate,
  shouldRevalidateAdminAfterSave,
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

test("only explicit save and publish actions enter operation history", () => {
  for (const saveIntent of ["autosave", "navigation"] as const) {
    assert.equal(
      shouldLogPostUpdate({
        saveIntent,
        previousStatus: "draft",
        nextStatus: "published",
      }),
      false,
    );
  }

  for (const saveIntent of ["manual", "publish"] as const) {
    assert.equal(
      shouldLogPostUpdate({
        saveIntent,
        previousStatus: "draft",
        nextStatus: saveIntent === "publish" ? "published" : "draft",
      }),
      true,
    );
  }
});

test("autosave does not revalidate the current admin route", () => {
  assert.equal(shouldRevalidateAdminAfterSave("autosave"), false);
  assert.equal(shouldRevalidateAdminAfterSave("manual"), true);
  assert.equal(shouldRevalidateAdminAfterSave("publish"), true);
});
