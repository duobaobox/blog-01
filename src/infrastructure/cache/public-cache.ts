import { revalidatePath, revalidateTag } from "next/cache";

export const PUBLIC_CACHE_REVALIDATE_SECONDS = 300;

export const PUBLIC_CACHE_TAGS = {
  posts: "public-posts",
  site: "public-site",
  taxonomy: "public-taxonomy",
} as const;

function uniqueSlugs(slugs: Array<string | null | undefined>) {
  return [...new Set(slugs.filter((slug): slug is string => Boolean(slug)))];
}

export type CachePathRevalidation = {
  path: string;
  type?: "layout";
};

export type CacheRevalidationPlan = {
  tags: string[];
  paths: CachePathRevalidation[];
};

/**
 * 标签失效必须显式传 `{ expire: 0 }`，不能用 `"max"`。
 *
 * `revalidateTag(tag, "max")` 只是把挂在该标签下的条目标记为 stale：它写入的过期时间
 * 是 `now + max.expire`（一年后），而缓存读取处的 `areTagsExpired` 要求
 * `expiredAt <= now` 才算过期，于是条目会继续被返回。实测后果是发布文章后公开列表
 * 仍旧返回旧数据，直到 300 秒 TTL 自然到期——违反“发布即刷新公开页面缓存”。
 *
 * 传 `{ expire: 0 }` 会写入 `expired = now`，下一次读取就真正穿过缓存拿到新数据；
 * 语义与 `updateTag` 相同，但不受“只能在 Server Action 中调用”的限制。
 */
function applyCacheRevalidationPlan(plan: CacheRevalidationPlan) {
  for (const tag of plan.tags) {
    revalidateTag(tag, { expire: 0 });
  }

  for (const entry of plan.paths) {
    revalidatePath(entry.path, entry.type);
  }
}

export function buildPublicSiteRevalidationPlan(): CacheRevalidationPlan {
  return {
    tags: [PUBLIC_CACHE_TAGS.site],
    paths: [
      { path: "/", type: "layout" },
      { path: "/feed.xml" },
      { path: "/sitemap.xml" },
      { path: "/robots.txt" },
    ],
  };
}

export function revalidatePublicSite() {
  applyCacheRevalidationPlan(buildPublicSiteRevalidationPlan());
}

export function buildPublicContentRevalidationPlan(options?: {
  postSlugs?: Array<string | null | undefined>;
  categorySlugs?: Array<string | null | undefined>;
  tagSlugs?: Array<string | null | undefined>;
}): CacheRevalidationPlan {
  return {
    tags: [PUBLIC_CACHE_TAGS.posts, PUBLIC_CACHE_TAGS.taxonomy],
    paths: [
      { path: "/" },
      { path: "/blog" },
      { path: "/feed.xml" },
      { path: "/sitemap.xml" },
      { path: "/blog/categories", type: "layout" },
      { path: "/blog/tags", type: "layout" },
      ...uniqueSlugs(options?.postSlugs ?? []).map((slug) => ({
        path: `/blog/${slug}`,
      })),
      ...uniqueSlugs(options?.categorySlugs ?? []).map((slug) => ({
        path: `/blog/categories/${slug}`,
      })),
      ...uniqueSlugs(options?.tagSlugs ?? []).map((slug) => ({
        path: `/blog/tags/${slug}`,
      })),
    ],
  };
}

export function revalidatePublicContent(options?: {
  postSlugs?: Array<string | null | undefined>;
  categorySlugs?: Array<string | null | undefined>;
  tagSlugs?: Array<string | null | undefined>;
}) {
  applyCacheRevalidationPlan(buildPublicContentRevalidationPlan(options));
}
