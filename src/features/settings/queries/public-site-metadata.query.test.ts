import assert from "node:assert/strict";
import test from "node:test";
import { createPublicSiteMetadataQueries } from "./public-site-metadata.query";

test("public site metadata queries compose stable sitemap timestamps", async () => {
  const queries = createPublicSiteMetadataQueries({
    async getResolvedSiteConfig() {
      return {
        name: "Example",
        description: "Example description",
        url: "https://example.com",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        nav: [],
        social: {
          github: "",
          x: "",
          email: "",
        },
      };
    },
    async getPublishedSlugs() {
      return [
        {
          slug: "first-post",
          updatedAt: new Date("2026-02-10T00:00:00.000Z"),
        },
      ] as never;
    },
    async getPublishedForFeed() {
      return [] as never;
    },
    async getPublicCategories() {
      return [
        {
          slug: "engineering",
          updatedAt: new Date("2026-03-05T00:00:00.000Z"),
        },
      ] as never;
    },
    async getPublicTags() {
      return [
        {
          slug: "react",
          updatedAt: new Date("2026-02-20T00:00:00.000Z"),
        },
      ] as never;
    },
  });

  const result = await queries.getSitemapData();

  assert.equal(result.site.url, "https://example.com");
  assert.equal(
    result.blogLastModified?.toISOString(),
    "2026-03-05T00:00:00.000Z",
  );
  assert.deepEqual(
    result.posts.map((post) => post.slug),
    ["first-post"],
  );
  assert.deepEqual(
    result.categories.map((category) => category.slug),
    ["engineering"],
  );
  assert.deepEqual(
    result.tags.map((tag) => tag.slug),
    ["react"],
  );
});

test("public site metadata feed query only uses published feed inputs", async () => {
  const calls: Array<{ fn: string; arg?: unknown }> = [];
  const queries = createPublicSiteMetadataQueries({
    async getResolvedSiteConfig() {
      calls.push({ fn: "getResolvedSiteConfig" });
      return {
        name: "Example",
        description: "Example description",
        url: "https://example.com",
        nav: [],
        social: {
          github: "",
          x: "",
          email: "",
        },
      };
    },
    async getPublishedSlugs() {
      calls.push({ fn: "getPublishedSlugs" });
      return [] as never;
    },
    async getPublishedForFeed(take) {
      calls.push({ fn: "getPublishedForFeed", arg: take });
      return [
        {
          slug: "feed-post",
        },
      ] as never;
    },
    async getPublicCategories() {
      calls.push({ fn: "getPublicCategories" });
      return [] as never;
    },
    async getPublicTags() {
      calls.push({ fn: "getPublicTags" });
      return [] as never;
    },
  });

  const result = await queries.getFeedData(12);

  assert.equal(result.site.url, "https://example.com");
  assert.equal(result.posts.length, 1);
  assert.deepEqual(calls, [
    { fn: "getResolvedSiteConfig" },
    { fn: "getPublishedForFeed", arg: 12 },
  ]);
});

test("public site metadata robots query only uses site settings", async () => {
  const calls: Array<{ fn: string; arg?: unknown }> = [];
  const queries = createPublicSiteMetadataQueries({
    async getResolvedSiteConfig() {
      calls.push({ fn: "getResolvedSiteConfig" });
      return {
        name: "Example",
        description: "Example description",
        url: "https://example.com",
        nav: [],
        social: {
          github: "",
          x: "",
          email: "",
        },
      };
    },
    async getPublishedSlugs() {
      calls.push({ fn: "getPublishedSlugs" });
      return [] as never;
    },
    async getPublishedForFeed(take) {
      calls.push({ fn: "getPublishedForFeed", arg: take });
      return [] as never;
    },
    async getPublicCategories() {
      calls.push({ fn: "getPublicCategories" });
      return [] as never;
    },
    async getPublicTags() {
      calls.push({ fn: "getPublicTags" });
      return [] as never;
    },
  });

  const result = await queries.getRobotsData();

  assert.equal(result.site.url, "https://example.com");
  assert.deepEqual(calls, [{ fn: "getResolvedSiteConfig" }]);
});
