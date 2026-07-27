import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import type { TaxonomyScope } from "@/features/taxonomy/repositories/category.repository";
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

export function createPublicTagQueries(repo: PublicTagRepository = tagRepo) {
  return {
    async getTags() {
      return withPublicQueryFallback(() => repo.findTags("public"), []);
    },
    async getTagBySlug(slug: string) {
      return withPublicQueryFallback(
        () => repo.findPublicTagBySlug(slug),
        null,
      );
    },
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
