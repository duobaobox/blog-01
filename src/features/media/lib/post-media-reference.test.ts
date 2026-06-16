import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPostMediaReferenceInputs,
  collectCandidateMediaUrls,
  extractContentImageUrls,
} from "./post-media-reference";

test("extractContentImageUrls walks tiptap image nodes", () => {
  const urls = extractContentImageUrls({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "hello" },
          {
            type: "image",
            attrs: { src: "/media/hero.png" },
          },
        ],
      },
      {
        type: "image",
        attrs: { src: "/media/cover.png" },
      },
    ],
  });

  assert.deepEqual(urls, ["/media/hero.png", "/media/cover.png"]);
});

test("buildPostMediaReferenceInputs maps cover and content usages while deduplicating entries", () => {
  const references = buildPostMediaReferenceInputs(
    {
      coverImageUrl: "/media/cover.png",
      contentJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "image",
                attrs: { src: "/media/cover.png" },
              },
              {
                type: "image",
                attrs: { src: "/media/body.png" },
              },
              {
                type: "image",
                attrs: { src: "/media/body.png" },
              },
            ],
          },
        ],
      },
    },
    [
      { id: "media-1", url: "/media/cover.png" },
      { id: "media-2", url: "/media/body.png" },
    ],
  );

  assert.deepEqual(references, [
    { mediaId: "media-1", usage: "cover" },
    { mediaId: "media-1", usage: "content" },
    { mediaId: "media-2", usage: "content" },
  ]);
});

test("collectCandidateMediaUrls merges cover and content urls", () => {
  const urls = collectCandidateMediaUrls({
    coverImageUrl: "/media/cover.png",
    contentJson: {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "/media/cover.png" },
        },
        {
          type: "image",
          attrs: { src: "/media/body.png" },
        },
      ],
    },
  });

  assert.deepEqual(urls, ["/media/cover.png", "/media/body.png"]);
});
