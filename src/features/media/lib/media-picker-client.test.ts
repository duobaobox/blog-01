import assert from "node:assert/strict";
import test from "node:test";
import { fetchMediaPickerItems } from "./media-picker-client";

test("fetchMediaPickerItems requests the filtered media endpoint without cache", async () => {
  const calls: Array<{
    input: string;
    init?: RequestInit;
  }> = [];
  const items = [
    {
      id: "media-1",
      url: "/media/image.png",
      filename: "image.png",
      mimeType: "image/png",
      size: 128,
      width: 32,
      height: 32,
      alt: null,
      createdAt: "2026-07-26T00:00:00.000Z",
    },
  ];

  const result = await fetchMediaPickerItems({
    mimeTypePrefix: "image",
    async fetcher(input, init) {
      calls.push({
        input: String(input),
        init,
      });
      return Response.json({ items });
    },
  });

  assert.deepEqual(result, items);
  assert.equal(calls[0]?.input, "/api/media?mimeTypePrefix=image");
  assert.equal(calls[0]?.init?.cache, "no-store");
  assert.equal(calls[0]?.init?.credentials, "same-origin");
});

test("fetchMediaPickerItems surfaces api errors instead of showing an empty library", async () => {
  await assert.rejects(
    fetchMediaPickerItems({
      async fetcher() {
        return Response.json(
          {
            error: "登录状态已失效",
          },
          {
            status: 401,
          },
        );
      },
    }),
    /登录状态已失效/,
  );
});

test("fetchMediaPickerItems rejects malformed successful responses", async () => {
  await assert.rejects(
    fetchMediaPickerItems({
      async fetcher() {
        return Response.json({
          items: null,
        });
      },
    }),
    /无法识别的数据/,
  );
});
