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

export type CacheTagRevalidation = {
  tag: string;
  profile: "max";
};

export type CachePathRevalidation = {
  path: string;
  type?: "layout";
};

export type CacheRevalidationPlan = {
  tags: CacheTagRevalidation[];
  paths: CachePathRevalidation[];
};

function applyCacheRevalidationPlan(plan: CacheRevalidationPlan) {
  for (const entry of plan.tags) {
    revalidateTag(entry.tag, entry.profile);
  }

  for (const entry of plan.paths) {
    revalidatePath(entry.path, entry.type);
  }
}

export function buildPublicSiteRevalidationPlan(): CacheRevalidationPlan {
  return {
    tags: [{ tag: PUBLIC_CACHE_TAGS.site, profile: "max" }],
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
    tags: [
      { tag: PUBLIC_CACHE_TAGS.posts, profile: "max" },
      { tag: PUBLIC_CACHE_TAGS.taxonomy, profile: "max" },
    ],
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
