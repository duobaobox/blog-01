import assert from "node:assert/strict";
import test from "node:test";
import {
  getPostDisplayDate,
  getPostStatusLabel,
  getPostStatusTone,
  isArchivedPost,
  isDraftPost,
  isPublishedPost,
  isReviewPost,
  summarizePostStatuses,
} from "./post-status";

test("post status helpers identify published posts and labels", () => {
  assert.equal(isDraftPost({ status: "draft" }), true);
  assert.equal(isDraftPost({ status: "review" }), false);
  assert.equal(isReviewPost({ status: "review" }), true);
  assert.equal(isReviewPost({ status: "published" }), false);
  assert.equal(isPublishedPost({ status: "published" }), true);
  assert.equal(isPublishedPost({ status: "draft" }), false);
  assert.equal(isArchivedPost({ status: "archived" }), true);
  assert.equal(isArchivedPost({ status: "draft" }), false);
  assert.equal(getPostStatusLabel({ status: "published" }), "已发布");
  assert.equal(getPostStatusLabel({ status: "archived" }), "已归档");
  assert.equal(getPostStatusLabel({ status: "review" }), "待发布");
  assert.equal(getPostStatusLabel({ status: "draft" }), "草稿");
  assert.equal(getPostStatusTone({ status: "published" }), "published");
  assert.equal(getPostStatusTone({ status: "archived" }), "archived");
  assert.equal(getPostStatusTone({ status: "review" }), "review");
  assert.equal(getPostStatusTone({ status: "draft" }), "draft");
});

test("summarizePostStatuses groups draft, review, and published posts", () => {
  assert.deepEqual(
    summarizePostStatuses([
      { status: "draft" },
      { status: "review" },
      { status: "published" },
      { status: "review" },
      { status: "archived" },
    ]),
    {
      draftCount: 1,
      reviewCount: 2,
      publishedCount: 1,
      archivedCount: 1,
    },
  );
});

test("getPostDisplayDate prefers publishedAt and falls back to createdAt", () => {
  const createdAt = new Date("2026-06-15T09:00:00.000Z");
  const publishedAt = new Date("2026-06-16T09:00:00.000Z");

  assert.equal(
    getPostDisplayDate({ createdAt, publishedAt }),
    publishedAt,
  );
  assert.equal(getPostDisplayDate({ createdAt, publishedAt: null }), createdAt);
});
