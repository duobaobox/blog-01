import assert from "node:assert/strict";
import test from "node:test";
import {
  getPostDisplayDate,
  getPostStatusLabel,
  getPostStatusTone,
  isInternalPost,
  isPublishedPost,
  summarizePostStatuses,
} from "./post-status";

test("post status helpers expose only internal and published product states", () => {
  assert.equal(isInternalPost({ status: "draft" }), true);
  assert.equal(isInternalPost({ status: "published" }), false);
  assert.equal(isPublishedPost({ status: "published" }), true);
  assert.equal(isPublishedPost({ status: "draft" }), false);
  assert.equal(getPostStatusLabel({ status: "published" }), "已发布");
  assert.equal(getPostStatusLabel({ status: "draft" }), "内部");
  assert.equal(getPostStatusTone({ status: "published" }), "published");
  assert.equal(getPostStatusTone({ status: "draft" }), "internal");
});

test("summarizePostStatuses groups internal and published posts", () => {
  assert.deepEqual(
    summarizePostStatuses([
      { status: "draft" },
      { status: "published" },
      { status: "draft" },
    ]),
    {
      internalCount: 2,
      publishedCount: 1,
    },
  );
});

test("getPostDisplayDate prefers publishedAt and falls back to createdAt", () => {
  const createdAt = new Date("2026-06-15T09:00:00.000Z");
  const publishedAt = new Date("2026-06-16T09:00:00.000Z");

  assert.equal(getPostDisplayDate({ createdAt, publishedAt }), publishedAt);
  assert.equal(getPostDisplayDate({ createdAt, publishedAt: null }), createdAt);
});
