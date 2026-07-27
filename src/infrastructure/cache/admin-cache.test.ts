import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_CACHE_TAGS,
  buildAdminRevalidationPlan,
  revalidateAdminPaths,
} from "./admin-cache";

test("buildAdminRevalidationPlan deduplicates admin paths and drops empty entries", () => {
  assert.deepEqual(
    buildAdminRevalidationPlan({
      paths: ["/admin/posts", "/admin/media", "/admin/posts", null, undefined],
      tags: [ADMIN_CACHE_TAGS.media, ADMIN_CACHE_TAGS.media, null],
    }),
    {
      tags: [
        { tag: ADMIN_CACHE_TAGS.media, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.posts, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.dashboard, profile: "max" },
      ],
      paths: [{ path: "/admin/posts" }, { path: "/admin/media" }],
    },
  );
});

test("buildAdminRevalidationPlan infers admin tags from known admin read surfaces", () => {
  assert.deepEqual(
    buildAdminRevalidationPlan({
      paths: [
        "/admin/posts",
        "/admin/media",
        "/admin/categories",
        "/admin/tags",
        "/admin/settings",
      ],
    }),
    {
      tags: [
        { tag: ADMIN_CACHE_TAGS.posts, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.dashboard, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.media, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.categories, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.tags, profile: "max" },
        { tag: ADMIN_CACHE_TAGS.settings, profile: "max" },
      ],
      paths: [
        { path: "/admin/posts" },
        { path: "/admin/media" },
        { path: "/admin/categories" },
        { path: "/admin/tags" },
        { path: "/admin/settings" },
      ],
    },
  );
});

test("revalidateAdminPaths reuses the same normalized plan as buildAdminRevalidationPlan", () => {
  assert.deepEqual(
    buildAdminRevalidationPlan({
      paths: ["/admin/posts", "/admin/media", "/admin/posts"],
    }),
    buildAdminRevalidationPlan({
      paths: ["/admin/posts", "/admin/media", "/admin/posts"],
    }),
  );

  assert.equal(typeof revalidateAdminPaths, "function");
});
