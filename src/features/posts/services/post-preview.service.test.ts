import assert from "node:assert/strict";
import test from "node:test";
import { buildPostPreviewPayload } from "./post-preview.service";

const materialized = {
  contentJson: { type: "doc", content: [{ type: "paragraph" }] },
  contentHtml: '<h2 id="preview">预览正文</h2>',
  contentText: "预览正文",
  contentToc: [{ id: "preview", title: "预览正文", level: 2 as const }],
  readingTimeMinutes: 2,
  wordCount: 360,
};

test("preview payload uses the current saved article metadata and materialized body", async () => {
  const payload = await buildPostPreviewPayload(
    {
      post: {
        id: "post-1",
        title: " 文章预览 ",
        status: "published",
        coverImageUrl: "/cover.png",
        contentJson: { type: "doc" },
        publishedAt: "2026-07-01T08:00:00.000Z",
        updatedAt: "2026-07-17T08:00:00.000Z",
        category: {
          id: "category-1",
          name: "工程",
          slug: "engineering",
        },
        tags: [
          {
            tag: {
              id: "tag-1",
              name: "Next.js",
              slug: "nextjs",
              color: null,
            },
          },
        ],
      },
      authorName: "Duobao",
    },
    async () => materialized,
  );

  assert.equal(payload.title, "文章预览");
  assert.equal(payload.displayDate, "2026-07-01T08:00:00.000Z");
  assert.equal(payload.authorName, "Duobao");
  assert.equal(payload.contentHtml, materialized.contentHtml);
  assert.deepEqual(payload.contentToc, materialized.contentToc);
  assert.deepEqual(
    payload.tags.map((tag) => tag.id),
    ["tag-1"],
  );
});

test("draft preview falls back to the saved update time and untitled display name", async () => {
  const payload = await buildPostPreviewPayload(
    {
      post: {
        id: "post-2",
        title: "",
        status: "draft",
        coverImageUrl: null,
        contentJson: { type: "doc" },
        publishedAt: null,
        updatedAt: "2026-07-17T10:30:00.000Z",
        category: null,
        tags: [],
      },
      authorName: " ",
    },
    async () => materialized,
  );

  assert.equal(payload.title, "未命名 1");
  assert.equal(payload.displayDate, "2026-07-17T10:30:00.000Z");
  assert.equal(payload.authorName, "Admin");
});
