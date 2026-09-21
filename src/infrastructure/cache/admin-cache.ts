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

export type AdminPathRevalidation = {
  path: string;
};

export type AdminRevalidationPlan = {
  tags: string[];
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

/**
 * 标签失效必须显式传 `{ expire: 0 }`，不能用 `"max"`。
 *
 * `revalidateTag(tag, "max")` 只把条目记为 stale：过期时间被写成 now + max.expire
 * （一年后），而缓存读取处的 areTagsExpired 要求 expiredAt <= now，于是本次读取仍返回
 * 旧值，只在后台再验证。实测表现是改完内容后第一次打开后台概览仍显示旧计数，刷新一次才对。
 *
 * 传 `{ expire: 0 }` 写入 expired = now，下一次读取即拿到新数据。
 */
function applyAdminRevalidationPlan(plan: AdminRevalidationPlan) {
  for (const tag of plan.tags) {
    revalidateTag(tag, { expire: 0 });
  }

  for (const entry of plan.paths) {
    revalidatePath(entry.path);
  }
}

export function buildAdminRevalidationPlan(input: {
  paths?: Array<string | null | undefined>;
  tags?: Array<string | null | undefined>;
}): AdminRevalidationPlan {
  const normalizedPaths = uniqueAdminPaths(input.paths ?? []);
  const normalizedTags = uniqueAdminTags([
    ...(input.tags ?? []),
    ...inferAdminTagsFromPaths(normalizedPaths),
  ]);

  return {
    tags: normalizedTags,
    paths: normalizedPaths.map((path) => ({ path })),
  };
}

export function revalidateAdminPaths(paths: Array<string | null | undefined>) {
  applyAdminRevalidationPlan(buildAdminRevalidationPlan({ paths }));
}

export function revalidateAdminPostTags() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      tags: [ADMIN_CACHE_TAGS.posts, ADMIN_CACHE_TAGS.dashboard],
    }),
  );
}

export function revalidateAdminPosts() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      paths: ["/admin/posts"],
      tags: [ADMIN_CACHE_TAGS.dashboard],
    }),
  );
}

export function revalidateAdminMedia() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      paths: ["/admin/media"],
    }),
  );
}

export function revalidateAdminPostsAndMedia() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      paths: ["/admin/posts", "/admin/media"],
    }),
  );
}

export function revalidateAdminCategories() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      paths: ["/admin/categories"],
    }),
  );
}

export function revalidateAdminTags() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      paths: ["/admin/tags"],
    }),
  );
}

export function revalidateAdminSettings() {
  applyAdminRevalidationPlan(
    buildAdminRevalidationPlan({
      paths: ["/admin/settings"],
    }),
  );
}

export function revalidateAdminAccount() {
  revalidateAdminPaths(["/admin/account", "/admin"]);
}
