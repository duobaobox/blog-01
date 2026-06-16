import assert from "node:assert/strict";
import test from "node:test";
import { createResolvedSiteConfigQuery } from "./site-config.query";

test("resolved site config projects logo and avatar media metadata", async () => {
  const calls: Array<Array<string | null | undefined>> = [];
  const query = createResolvedSiteConfigQuery({
    async findSiteSettings() {
      return {
        scopeKey: "default",
        siteTitle: "Example Blog",
        siteSubtitle: "Notes",
        siteDescription: "Example description",
        siteUrl: "https://example.com/",
        logoUrl: "/media/logo.png",
        avatarUrl: "https://cdn.example.com/avatar.png",
        githubUrl: "https://github.com/example",
        xUrl: "https://x.com/example",
        email: "hi@example.com",
        footerText: "Footer",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-15T00:00:00.000Z"),
      } as never;
    },
    async resolveMediaPresentationMap(urls) {
      calls.push(urls);
      return new Map([
        ["/media/logo.png", {
          url: "/media/logo.png",
          width: 320,
          height: 96,
          alt: "Site logo",
        }],
      ]);
    },
  });

  const result = await query();

  assert.equal(result.url, "https://example.com");
  assert.deepEqual(calls, [[
    "/media/logo.png",
    "https://cdn.example.com/avatar.png",
  ]]);
  assert.deepEqual(result.logo, {
    url: "/media/logo.png",
    width: 320,
    height: 96,
    alt: "Site logo",
  });
  assert.deepEqual(result.avatar, {
    url: "https://cdn.example.com/avatar.png",
    width: null,
    height: null,
    alt: null,
  });
  assert.equal(result.logoUrl, "/media/logo.png");
  assert.equal(result.avatarUrl, "https://cdn.example.com/avatar.png");
});

test("resolved site config falls back to static config when settings are unavailable", async () => {
  let resolverCalls = 0;
  const query = createResolvedSiteConfigQuery({
    async findSiteSettings() {
      return null;
    },
    async resolveMediaPresentationMap() {
      resolverCalls += 1;
      return new Map();
    },
  });

  const result = await query();

  assert.equal(typeof result.name, "string");
  assert.equal(typeof result.description, "string");
  assert.equal(typeof result.url, "string");
  assert.equal(resolverCalls, 0);
  assert.equal(result.logo, undefined);
  assert.equal(result.avatar, undefined);
});
