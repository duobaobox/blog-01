import assert from "node:assert/strict";
import test from "node:test";
import { createResolvedSiteConfigQuery } from "./site-config.query";

test("resolved site config projects the configured logo metadata", async () => {
  const calls: Array<Array<string | null | undefined>> = [];
  const query = createResolvedSiteConfigQuery({
    async findSiteSettings() {
      return {
        scopeKey: "default",
        siteTitle: "Example Blog",
        siteSubtitle: "Legacy subtitle",
        siteDescription: "Example description",
        siteUrl: "https://example.com/",
        logoUrl: "/media/logo.png",
        avatarUrl: "https://cdn.example.com/legacy-avatar.png",
        githubUrl: "https://github.com/legacy",
        xUrl: "https://x.com/legacy",
        email: "hi@example.com",
        footerText: "Footer",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-15T00:00:00.000Z"),
      } as never;
    },
    async resolveMediaPresentationMap(urls) {
      calls.push(urls);
      return new Map([
        [
          "/media/logo.png",
          {
            url: "/media/logo.png",
            width: 320,
            height: 96,
            alt: "Site logo",
          },
        ],
      ]);
    },
  });

  const result = await query();

  assert.equal(result.url, "https://example.com");
  assert.deepEqual(calls, [["/media/logo.png"]]);
  assert.deepEqual(result.logo, {
    url: "/media/logo.png",
    width: 320,
    height: 96,
    alt: "Site logo",
  });
  assert.equal(result.logoUrl, "/media/logo.png");
  assert.equal(result.email, "hi@example.com");
  assert.equal("avatar" in result, false);
  assert.equal("social" in result, false);
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
});
