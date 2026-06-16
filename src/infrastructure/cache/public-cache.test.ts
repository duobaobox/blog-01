import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicContentRevalidationPlan,
  buildPublicSiteRevalidationPlan,
  PUBLIC_CACHE_TAGS,
} from "./public-cache";

test("buildPublicSiteRevalidationPlan refreshes site-wide public surfaces", () => {
  assert.deepEqual(buildPublicSiteRevalidationPlan(), {
    tags: [{ tag: PUBLIC_CACHE_TAGS.site, profile: "max" }],
    paths: [
      { path: "/", type: "layout" },
      { path: "/feed.xml" },
      { path: "/sitemap.xml" },
      { path: "/robots.txt" },
    ],
  });
});

test("buildPublicContentRevalidationPlan includes canonical public routes and unique detail pages", () => {
  const plan = buildPublicContentRevalidationPlan({
    postSlugs: ["hello-world", "hello-world", null],
    categorySlugs: ["design-systems", undefined],
    tagSlugs: ["nextjs", "react", "react"],
  });

  assert.deepEqual(plan.tags, [
    { tag: PUBLIC_CACHE_TAGS.posts, profile: "max" },
    { tag: PUBLIC_CACHE_TAGS.taxonomy, profile: "max" },
  ]);
  assert.deepEqual(plan.paths, [
    { path: "/" },
    { path: "/blog" },
    { path: "/feed.xml" },
    { path: "/sitemap.xml" },
    { path: "/blog/categories", type: "layout" },
    { path: "/blog/tags", type: "layout" },
    { path: "/blog/hello-world" },
    { path: "/blog/categories/design-systems" },
    { path: "/blog/tags/nextjs" },
    { path: "/blog/tags/react" },
  ]);
});
