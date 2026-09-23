import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";
import {
  PUBLIC_CACHE_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from "@/infrastructure/cache/public-cache";
import { memoizeQuery, type QueryMemoizer } from "@/shared/lib/request-memo";
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

/**
 * 公开分类读操作接入数据缓存并挂上 taxonomy 标签。
 *
 * 缓存放在仓储调用这一层：`withPublicQueryFallback` 留在缓存边界之外，
 * 数据库不可用时的空列表兜底不会被写进缓存。
 */
function createCachedPublicCategoryRepository(): PublicCategoryRepository {
  return {
    findCategories: unstable_cache(
      (scope?: categoryRepo.TaxonomyScope) =>
        categoryRepo.findCategories(scope),
      ["public-categories"],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [PUBLIC_CACHE_TAGS.taxonomy],
      },
    ),
    findPublicCategoryBySlug: unstable_cache(
      (slug: string) => categoryRepo.findPublicCategoryBySlug(slug),
      ["public-category-by-slug"],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [PUBLIC_CACHE_TAGS.taxonomy],
      },
    ),
  };
}

export function createPublicCategoryQueries(
  repo: PublicCategoryRepository = createCachedPublicCategoryRepository(),
  memoize: QueryMemoizer = memoizeQuery,
) {
  return {
    getCategories: memoize(async () => {
      return withPublicQueryFallback(() => repo.findCategories("public"), []);
    }),
    getCategoryBySlug: memoize(async (slug: string) => {
      return withPublicQueryFallback(
        () => repo.findPublicCategoryBySlug(slug),
        null,
      );
    }),
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
