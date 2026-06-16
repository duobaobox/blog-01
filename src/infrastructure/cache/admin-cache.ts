import { revalidatePath, revalidateTag } from "next/cache";

export const ADMIN_CACHE_TAGS = {
  dashboard: "admin-dashboard",
  posts: "admin-posts",
  media: "admin-media",
  categories: "admin-categories",
  tags: "admin-tags",
  settings: "admin-settings",
} as const;

export const ADMIN_CACHE_REVALIDATE_SECONDS = 60;

export type AdminTagRevalidation = {
  tag: string;
  profile: "max";
};

export type AdminPathRevalidation = {
  path: string;
};

export type AdminRevalidationPlan = {
  tags: AdminTagRevalidation[];
  paths: AdminPathRevalidation[];
};

function uniqueAdminPaths(paths: Array<string | null | undefined>) {
  return [...new Set(paths.filter((path): path is string => Boolean(path)))];
}

function uniqueAdminTags(tags: Array<string | null | undefined>) {
  return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))];
}

function inferAdminTagsFromPaths(paths: Array<string | null | undefined>) {
  const tags: string[] = [];

  for (const path of paths) {
    if (!path) {
      continue;
    }

    if (path === "/admin/media") {
      tags.push(ADMIN_CACHE_TAGS.media);
      continue;
    }

    if (path === "/admin/posts") {
      tags.push(ADMIN_CACHE_TAGS.posts, ADMIN_CACHE_TAGS.dashboard);
      continue;
    }

    if (path === "/admin/categories") {
      tags.push(ADMIN_CACHE_TAGS.categories, ADMIN_CACHE_TAGS.dashboard);
      continue;
    }

    if (path === "/admin/tags") {
      tags.push(ADMIN_CACHE_TAGS.tags, ADMIN_CACHE_TAGS.dashboard);
      continue;
    }

    if (path === "/admin/settings") {
      tags.push(ADMIN_CACHE_TAGS.settings);
    }
  }

  return uniqueAdminTags(tags);
}

function applyAdminRevalidationPlan(plan: AdminRevalidationPlan) {
  for (const entry of plan.tags) {
    revalidateTag(entry.tag, entry.profile);
  }

  for (const entry of plan.paths) {
    revalidatePath(entry.path);
  }
}

export function buildAdminRevalidationPlan(
  input: {
    paths?: Array<string | null | undefined>;
    tags?: Array<string | null | undefined>;
  },
): AdminRevalidationPlan {
  const normalizedPaths = uniqueAdminPaths(input.paths ?? []);
  const normalizedTags = uniqueAdminTags([
    ...(input.tags ?? []),
    ...inferAdminTagsFromPaths(normalizedPaths),
  ]);

  return {
    tags: normalizedTags.map((tag) => ({
      tag,
      profile: "max" as const,
    })),
    paths: normalizedPaths.map((path) => ({ path })),
  };
}

export function revalidateAdminPaths(paths: Array<string | null | undefined>) {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({ paths }));
}

export function revalidateAdminPosts() {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({
    paths: ["/admin/posts"],
    tags: [ADMIN_CACHE_TAGS.dashboard],
  }));
}

export function revalidateAdminMedia() {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({
    paths: ["/admin/media"],
  }));
}

export function revalidateAdminPostsAndMedia() {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({
    paths: ["/admin/posts", "/admin/media"],
  }));
}

export function revalidateAdminCategories() {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({
    paths: ["/admin/categories"],
  }));
}

export function revalidateAdminTags() {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({
    paths: ["/admin/tags"],
  }));
}

export function revalidateAdminSettings() {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({
    paths: ["/admin/settings"],
  }));
}

export function revalidateAdminAccount() {
  revalidateAdminPaths(["/admin/account", "/admin"]);
}
