import assert from "node:assert/strict";
import test from "node:test";
import {
  extractLocalStorageKey,
  normalizeStorageProvider,
  resolveMediaStorageRecord,
} from "./media-storage";

test("extractLocalStorageKey reads filenames from local media URLs", () => {
  assert.equal(extractLocalStorageKey("/media/demo-image.jpg"), "demo-image.jpg");
  assert.equal(extractLocalStorageKey("https://example.com/media/demo.jpg"), null);
});

test("normalizeStorageProvider falls back to local for legacy records", () => {
  assert.equal(normalizeStorageProvider(undefined), "local");
  assert.equal(normalizeStorageProvider(null), "local");
  assert.equal(normalizeStorageProvider("local"), "local");
  assert.equal(normalizeStorageProvider("vercel-blob"), "vercel-blob");
});

test("resolveMediaStorageRecord preserves explicit provider and key", () => {
  assert.deepEqual(
    resolveMediaStorageRecord({
      url: "https://blob.vercel-storage.com/media/demo.jpg",
      storageProvider: "vercel-blob",
      storageKey: "media/demo.jpg",
    }),
    {
      provider: "vercel-blob",
      key: "media/demo.jpg",
      url: "https://blob.vercel-storage.com/media/demo.jpg",
    },
  );
});

test("resolveMediaStorageRecord derives local key for legacy rows", () => {
  assert.deepEqual(
    resolveMediaStorageRecord({
      url: "/media/legacy-file.pdf",
    }),
    {
      provider: "local",
      key: "legacy-file.pdf",
      url: "/media/legacy-file.pdf",
    },
  );
});
