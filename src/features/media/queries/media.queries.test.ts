import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMediaPresentation,
  createAdminMediaPageDataQuery,
  createResolveMediaPresentationMapQuery,
} from "./media.queries";

test("createAdminMediaPageDataQuery short-circuits during production build", async () => {
  const calls: string[] = [];
  const query = createAdminMediaPageDataQuery({
    isProductionBuildPhase() {
      calls.push("phase");
      return true;
    },
    async getMediaList() {
      calls.push("media");
      return [
        {
          id: "media-1",
          url: "https://example.com/image.png",
          filename: "image.png",
          mimeType: "image/png",
          size: 128,
          width: 32,
          height: 32,
          alt: null,
          createdAt: "2026-06-15T00:00:00.000Z",
        },
      ];
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["phase"]);
  assert.deepEqual(result, {
    items: [],
  });
});

test("createAdminMediaPageDataQuery returns media items outside production build", async () => {
  const calls: string[] = [];
  const query = createAdminMediaPageDataQuery({
    isProductionBuildPhase() {
      calls.push("phase");
      return false;
    },
    async getMediaList() {
      calls.push("media");
      return [
        {
          id: "media-1",
          url: "https://example.com/image.png",
          filename: "image.png",
          mimeType: "image/png",
          size: 128,
          width: 32,
          height: 32,
          alt: null,
          createdAt: "2026-06-15T00:00:00.000Z",
        },
      ];
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["phase", "media"]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.id, "media-1");
});

test("buildMediaPresentation creates stable display variants from stored metadata", () => {
  assert.deepEqual(
    buildMediaPresentation({
      url: "/media/cover.png",
      width: 1600,
      height: 900,
      alt: "Cover",
    }),
    {
      url: "/media/cover.png",
      width: 1600,
      height: 900,
      alt: "Cover",
      variants: {
        thumbnail: {
          url: "/media/cover.png",
          width: 320,
          height: 180,
        },
        card: {
          url: "/media/cover.png",
          width: 960,
          height: 540,
        },
        original: {
          url: "/media/cover.png",
          width: 1600,
          height: 900,
        },
      },
    },
  );
});

test("createResolveMediaPresentationMapQuery returns metadata-backed presentations with variants", async () => {
  const calls: string[][] = [];
  const query = createResolveMediaPresentationMapQuery({
    async findMediaByUrls(urls) {
      calls.push(urls);
      return [
        {
          url: "/media/cover.png",
          width: 1200,
          height: 630,
          alt: "Cover alt",
        },
      ];
    },
  });

  const result = await query([
    "/media/cover.png",
    " /media/cover.png ",
    "",
    null,
    undefined,
  ]);

  assert.deepEqual(calls, [["/media/cover.png"]]);
  assert.deepEqual(result.get("/media/cover.png"), {
    url: "/media/cover.png",
    width: 1200,
    height: 630,
    alt: "Cover alt",
    variants: {
      thumbnail: {
        url: "/media/cover.png",
        width: 320,
        height: 168,
      },
      card: {
        url: "/media/cover.png",
        width: 960,
        height: 504,
      },
      original: {
        url: "/media/cover.png",
        width: 1200,
        height: 630,
      },
    },
  });
});
