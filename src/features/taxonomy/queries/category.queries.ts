import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";
import { withPublicQueryFallback } from "@/shared/lib/public-query-fallback";
import { isProductionBuildPhase } from "@/shared/lib/runtime-phase";

export async function getCategories(
  scope: categoryRepo.TaxonomyScope = "admin",
) {
  if (scope === "admin") {
    return getAdminCategoriesCached();
  }

  return categoryRepo.findCategories(scope);
}

let getAdminCategoriesCachedQuery:
  (() => ReturnType<typeof categoryRepo.findCategories>) | null = null;

function getAdminCategoriesCached() {
  getAdminCategoriesCachedQuery ??= unstable_cache(
    () => categoryRepo.findCategories("admin"),
    ["admin-categories"],
    {
      revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.categories],
    },
  );

  return getAdminCategoriesCachedQuery();
}

type PublicCategoryRepository = Pick<
  typeof categoryRepo,
  "findCategories" | "findPublicCategoryBySlug"
>;

export function createPublicCategoryQueries(
  repo: PublicCategoryRepository = categoryRepo,
) {
  return {
    async getCategories() {
      return withPublicQueryFallback(() => repo.findCategories("public"), []);
    },
    async getCategoryBySlug(slug: string) {
      return withPublicQueryFallback(
        () => repo.findPublicCategoryBySlug(slug),
        null,
      );
    },
  };
}

const publicCategoryQueries = createPublicCategoryQueries();

export const getPublicCategories = publicCategoryQueries.getCategories;
export const getPublicCategoryBySlug = publicCategoryQueries.getCategoryBySlug;

export async function getCategoryBySlug(slug: string) {
  return categoryRepo.findCategoryBySlug(slug);
}

export type AdminCategoriesPageData = {
  categories: Awaited<ReturnType<typeof categoryRepo.findCategories>>;
};

type AdminCategoriesPageDataDependencies = {
  isProductionBuildPhase: () => boolean;
  getCategories: () => Promise<AdminCategoriesPageData["categories"]>;
};

export function createAdminCategoriesPageDataQuery(
  dependencies: AdminCategoriesPageDataDependencies = {
    isProductionBuildPhase,
    getCategories: () => getCategories("admin"),
  },
) {
  return async function getAdminCategoriesPageData(): Promise<AdminCategoriesPageData> {
    if (dependencies.isProductionBuildPhase()) {
      return {
        categories: [],
      };
    }

    return {
      categories: await dependencies.getCategories(),
    };
  };
}

const getAdminCategoriesPageDataQuery = createAdminCategoriesPageDataQuery();

export async function getAdminCategoriesPageData(): Promise<AdminCategoriesPageData> {
  return getAdminCategoriesPageDataQuery();
}
