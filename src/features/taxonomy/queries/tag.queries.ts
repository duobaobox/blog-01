import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import type { TaxonomyScope } from "@/features/taxonomy/repositories/category.repository";
import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from "@/infrastructure/cache/public-cache";
import { memoizeQuery, type QueryMemoizer } from "@/shared/lib/request-memo";
import { withPublicQueryFallback } from "@/shared/lib/public-query-fallback";
import { isProductionBuildPhase } from "@/shared/lib/runtime-phase";

export async function getTags(scope: TaxonomyScope = "admin") {
  if (scope === "admin") {
    return getAdminTagsCached();
  }

  return tagRepo.findTags(scope);
}

let getAdminTagsCachedQuery:
  (() => ReturnType<typeof tagRepo.findTags>) | null = null;

function getAdminTagsCached() {
  getAdminTagsCachedQuery ??= unstable_cache(
    () => tagRepo.findTags("admin"),
    ["admin-tags"],
    {
      revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.tags],
    },
  );

  return getAdminTagsCachedQuery();
}

type PublicTagRepository = Pick<
  typeof tagRepo,
  "findTags" | "findPublicTagBySlug"
>;

/**
 * 公开标签读操作接入数据缓存并挂上 taxonomy 标签（理由同分类查询）。
 */
function createCachedPublicTagRepository(): PublicTagRepository {
  return {
    findTags: unstable_cache(
      (scope?: TaxonomyScope) => tagRepo.findTags(scope),
      ["public-tags"],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [PUBLIC_CACHE_TAGS.taxonomy],
      },
    ),
    findPublicTagBySlug: unstable_cache(
      (slug: string) => tagRepo.findPublicTagBySlug(slug),
      ["public-tag-by-slug"],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [PUBLIC_CACHE_TAGS.taxonomy],
      },
    ),
  };
}

export function createPublicTagQueries(
  repo: PublicTagRepository = createCachedPublicTagRepository(),
  memoize: QueryMemoizer = memoizeQuery,
) {
  return {
    getTags: memoize(async () => {
      return withPublicQueryFallback(() => repo.findTags("public"), []);
    }),
    getTagBySlug: memoize(async (slug: string) => {
      return withPublicQueryFallback(
        () => repo.findPublicTagBySlug(slug),
        null,
      );
    }),
  };
}

const publicTagQueries = createPublicTagQueries();

export const getPublicTags = publicTagQueries.getTags;
export const getPublicTagBySlug = publicTagQueries.getTagBySlug;

export async function getTagBySlug(slug: string) {
  return tagRepo.findTagBySlug(slug);
}

export type AdminTagsPageData = {
  tags: Awaited<ReturnType<typeof tagRepo.findTags>>;
};

type AdminTagsPageDataDependencies = {
  isProductionBuildPhase: () => boolean;
  getTags: () => Promise<AdminTagsPageData["tags"]>;
};

export function createAdminTagsPageDataQuery(
  dependencies: AdminTagsPageDataDependencies = {
    isProductionBuildPhase,
    getTags: () => getTags("admin"),
  },
) {
  return async function getAdminTagsPageData(): Promise<AdminTagsPageData> {
    if (dependencies.isProductionBuildPhase()) {
      return {
        tags: [],
      };
    }

    return {
      tags: await dependencies.getTags(),
    };
  };
}

const getAdminTagsPageDataQuery = createAdminTagsPageDataQuery();

export async function getAdminTagsPageData(): Promise<AdminTagsPageData> {
  return getAdminTagsPageDataQuery();
}
