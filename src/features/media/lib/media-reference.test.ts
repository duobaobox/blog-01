import assert from "node:assert/strict";
import test from "node:test";
import { buildMediaReferences } from "./media-reference";

test("buildMediaReferences maps cover and content usages from post candidates", () => {
  const updatedAt = new Date("2026-06-15T09:00:00.000Z");

  const references = buildMediaReferences([
    {
      id: "post-1",
      title: "Launch Notes",
      status: "published",
      updatedAt,
      folder: {
        id: "folder-1",
        name: "Strategy",
        slug: "strategy",
      },
      mediaReferences: [
        { usage: "cover" },
        { usage: "content" },
      ],
    },
    {
      id: "post-2",
      title: "Draft Ideas",
      status: "draft",
      updatedAt,
      folder: null,
      mediaReferences: [{ usage: "content" }],
    },
  ]);

  assert.deepEqual(references, [
    {
      id: "post-1",
      title: "Launch Notes",
      status: "published",
      updatedAt,
      folder: {
        id: "folder-1",
        name: "Strategy",
        slug: "strategy",
      },
      usage: ["cover", "content"],
    },
    {
      id: "post-2",
      title: "Draft Ideas",
      status: "draft",
      updatedAt,
      folder: null,
      usage: ["content"],
    },
  ]);
});
