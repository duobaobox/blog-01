import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import {
  resolveMediaPresentationMap,
  type MediaPresentation,
} from "@/features/media/queries/media.queries";
import * as postRepo from "@/features/posts/repositories/post.repository";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import {
  getTotalPages,
  PUBLIC_POSTS_PER_PAGE,
} from "@/features/posts/lib/pagination";
import type { AdminPostMetricsSnapshot } from "@/features/posts/repositories/post.repository";
import { withPublicQueryFallback } from "@/shared/lib/public-query-fallback";
import { isProductionBuildPhase } from "@/shared/lib/runtime-phase";

type PublicPostCardRecord = Awaited<
  ReturnType<typeof postRepo.findPublicPostCards>
>[number];
type PublishedPostRecord = NonNullable<
  Awaited<ReturnType<typeof postRepo.findPublishedPostBySlug>>
>;
type AdminDashboardContinueWritingPost = Awaited<
  ReturnType<typeof postRepo.findLatestInternalPostForDashboard>
>;
type AdminDashboardRecentPublishedPost = Awaited<
  ReturnType<typeof postRepo.findRecentPublishedPostsForDashboard>
>[number];
type ResolveMediaPresentationMap = typeof resolveMediaPresentationMap;

export type PublicPostCard = PublicPostCardRecord & {
  coverImage?: MediaPresentation;
};

export type PublicPublishedPost = PublishedPostRecord & {
  coverImage?: MediaPresentation;
};

export interface PublicPostsPageData {
  posts: PublicPostCard[];
  totalPosts: number;
  totalPages: number;
}

export interface AdminDashboardPageData {
  statCards: AdminDashboardStatCard[];
  continueWriting: AdminDashboardContinueWritingPost;
  recentPublished: AdminDashboardRecentPublishedPost[];
}

export type AdminPostCounts = AdminPostMetricsSnapshot;

export type AdminDashboardOverviewStats = Pick<
  AdminPostCounts,
  "published" | "internal"
>;

export type AdminDashboardTaxonomyStats = {
  categories: number;
  tags: number;
};

export type AdminDashboardStatCard = {
  label: string;
  value: number;
  description: string;
  iconKey: "post" | "folder" | "tag" | "trend";
  href: string;
};

function buildCoverImagePresentation(
  coverImageUrl: string | null,
  mediaByUrl: Map<string, MediaPresentation>,
) {
  if (!coverImageUrl) {
    return undefined;
  }

  return (
    mediaByUrl.get(coverImageUrl) ?? {
      url: coverImageUrl,
      width: null,
      height: null,
      alt: null,
    }
  );
}

function attachCoverImageToPost<T extends { coverImageUrl: string | null }>(
  post: T,
  mediaByUrl: Map<string, MediaPresentation>,
) {
  const coverImage = buildCoverImagePresentation(
    post.coverImageUrl,
    mediaByUrl,
  );

  if (!coverImage) {
    return post as T & { coverImage?: MediaPresentation };
  }

  return {
    ...post,
    coverImage,
  };
}

async function attachCoverImagesToPosts<
  T extends { coverImageUrl: string | null },
>(posts: T[], resolveCoverMediaPresentationMap: ResolveMediaPresentationMap) {
  const mediaByUrl = await resolveCoverMediaPresentationMap(
    posts.map((post) => post.coverImageUrl),
  );

  return posts.map((post) => attachCoverImageToPost(post, mediaByUrl));
}

async function attachCoverImageToPublishedPost(
  post: PublishedPostRecord | null,
  resolveCoverMediaPresentationMap: ResolveMediaPresentationMap,
) {
  if (!post) {
    return null;
  }

  const mediaByUrl = await resolveCoverMediaPresentationMap([
    post.coverImageUrl,
  ]);
  return attachCoverImageToPost(post, mediaByUrl) as PublicPublishedPost;
}

export async function getPosts(options?: postRepo.FindPostsOptions) {
  return postRepo.findPosts(options);
}

type PublicPostRepository = Pick<
  typeof postRepo,
  "findPublishedPostBySlug" | "findPublishedForFeed" | "findPublishedSlugs"
>;

export function createPublicPostQueries(
  repo: PublicPostRepository = postRepo,
  resolveCoverMediaPresentationMap: ResolveMediaPresentationMap = resolveMediaPresentationMap,
) {
  return {
    async getPostBySlug(slug: string) {
      return withPublicQueryFallback(
        async () =>
          attachCoverImageToPublishedPost(
            await repo.findPublishedPostBySlug(slug),
            resolveCoverMediaPresentationMap,
          ),
        null,
      );
    },
    async getPublishedForFeed(take?: number) {
      return withPublicQueryFallback(() => repo.findPublishedForFeed(take), []);
    },
    async getPublishedSlugs() {
      return withPublicQueryFallback(() => repo.findPublishedSlugs(), []);
    },
  };
}

const publicPostQueries = createPublicPostQueries();

export const getPostBySlug = publicPostQueries.getPostBySlug;

export async function getPostById(id: string) {
  return postRepo.findPostById(id);
}

export async function getPostCount(filters?: string | postRepo.PostFilters) {
  return postRepo.countPosts(filters);
}

export const getPublishedForFeed = publicPostQueries.getPublishedForFeed;

export const getPublishedSlugs = publicPostQueries.getPublishedSlugs;

type HomepagePostsRepository = Pick<typeof postRepo, "findPublicPostCards">;

export function createHomepageFeaturedOrLatestPostsQuery(
  repo: HomepagePostsRepository = postRepo,
  resolveCoverMediaPresentationMap: ResolveMediaPresentationMap = resolveMediaPresentationMap,
) {
  return async function getHomepageFeaturedOrLatestPosts(take = 3) {
    return withPublicQueryFallback(
      async () => {
        const featuredPosts = await repo.findPublicPostCards({
          status: "published",
          isFeatured: true,
          order: "published",
          take,
        });

        if (featuredPosts.length > 0) {
          return {
            posts: await attachCoverImagesToPosts(
              featuredPosts,
              resolveCoverMediaPresentationMap,
            ),
            source: "featured" as const,
          };
        }

        return {
          posts: await attachCoverImagesToPosts(
            await repo.findPublicPostCards({
              status: "published",
              order: "published",
              take,
            }),
            resolveCoverMediaPresentationMap,
          ),
          source: "latest" as const,
        };
      },
      {
        posts: [],
        source: "latest" as const,
      },
    );
  };
}

export const getHomepageFeaturedOrLatestPosts =
  createHomepageFeaturedOrLatestPostsQuery();

type AdminPostCountsRepository = Pick<
  typeof postRepo,
  "getAdminPostMetricsSnapshot"
>;

export function createAdminPostCountsQuery(
  repo: AdminPostCountsRepository = postRepo,
) {
  return async function getAdminPostCounts(): Promise<AdminPostCounts> {
    return repo.getAdminPostMetricsSnapshot();
  };
}

const getAdminPostCountsCached = unstable_cache(
  createAdminPostCountsQuery(),
  ["admin-post-counts"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.dashboard],
  },
);

export async function getAdminPostCounts() {
  return getAdminPostCountsCached();
}

export function projectAdminDashboardOverviewStats(
  counts: AdminPostCounts,
): AdminDashboardOverviewStats {
  return {
    published: counts.published,
    internal: counts.internal,
  };
}

export async function getAdminDashboardOverviewStats(): Promise<AdminDashboardOverviewStats> {
  return projectAdminDashboardOverviewStats(await getAdminPostCounts());
}

export function projectAdminDashboardTaxonomyStats(input: {
  categories: number;
  tags: number;
}): AdminDashboardTaxonomyStats {
  return {
    categories: input.categories,
    tags: input.tags,
  };
}

export function projectAdminDashboardStatCards(input: {
  overview: AdminDashboardOverviewStats;
  taxonomy: AdminDashboardTaxonomyStats;
}): AdminDashboardStatCard[] {
  return [
    {
      label: "已发布文章",
      value: input.overview.published,
      description: "公开可见的文章",
      iconKey: "post",
      href: "/admin/posts",
    },
    {
      label: "内部",
      value: input.overview.internal,
      description: "仅在后台可见的内容",
      iconKey: "trend",
      href: "/admin/posts?status=internal",
    },
    {
      label: "分类",
      value: input.taxonomy.categories,
      description: "内容分类数量",
      iconKey: "folder",
      href: "/admin/categories",
    },
    {
      label: "标签",
      value: input.taxonomy.tags,
      description: "文章标签数量",
      iconKey: "tag",
      href: "/admin/tags",
    },
  ];
}

const getAdminDashboardRecentPublishedCached = unstable_cache(
  (take: number) => postRepo.findRecentPublishedPostsForDashboard(take),
  ["admin-dashboard-recent-published"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.dashboard],
  },
);

type AdminDashboardPageDataDependencies = {
  isProductionBuildPhase: () => boolean;
  getOverviewStats: () => Promise<AdminDashboardOverviewStats>;
  getCategories: () => Promise<Array<{ id: string }>>;
  getTags: () => Promise<Array<{ id: string }>>;
  getContinueWriting: () => Promise<AdminDashboardPageData["continueWriting"]>;
  getRecentPublished: (
    take: number,
  ) => Promise<AdminDashboardPageData["recentPublished"]>;
};

export function createAdminDashboardPageDataQuery(
  dependencies: Partial<AdminDashboardPageDataDependencies> = {},
) {
  const resolvedDependencies: AdminDashboardPageDataDependencies = {
    isProductionBuildPhase,
    getOverviewStats: getAdminDashboardOverviewStats,
    getCategories: () => getCategories("admin"),
    getTags: () => getTags("admin"),
    getContinueWriting: postRepo.findLatestInternalPostForDashboard,
    getRecentPublished: getAdminDashboardRecentPublishedCached,
    ...dependencies,
  };

  return async function getAdminDashboardPageData(
    recentPublishedTake = 3,
  ): Promise<AdminDashboardPageData> {
    if (resolvedDependencies.isProductionBuildPhase()) {
      return {
        statCards: [],
        continueWriting: null,
        recentPublished: [],
      };
    }

    const [overview, categories, tags, continueWriting, recentPublished] =
      await Promise.all([
        resolvedDependencies.getOverviewStats(),
        resolvedDependencies.getCategories(),
        resolvedDependencies.getTags(),
        resolvedDependencies.getContinueWriting(),
        resolvedDependencies.getRecentPublished(recentPublishedTake),
      ]);

    const taxonomy = projectAdminDashboardTaxonomyStats({
      categories: categories.length,
      tags: tags.length,
    });

    return {
      statCards: projectAdminDashboardStatCards({
        overview,
        taxonomy,
      }),
      continueWriting,
      recentPublished,
    };
  };
}

const getAdminDashboardPageDataQuery = createAdminDashboardPageDataQuery();

export async function getAdminDashboardPageData(
  recentPublishedTake = 3,
): Promise<AdminDashboardPageData> {
  return getAdminDashboardPageDataQuery(recentPublishedTake);
}

type PublicPostsPageDataDependencies = {
  getPostCount: typeof getPostCount;
  findPublicPostCards: typeof postRepo.findPublicPostCards;
  resolveMediaPresentationMap: ResolveMediaPresentationMap;
};

export function createPublicPostsPageDataQuery(
  dependencies: PublicPostsPageDataDependencies = {
    getPostCount,
    findPublicPostCards: postRepo.findPublicPostCards,
    resolveMediaPresentationMap,
  },
) {
  return async function getPublicPostsPageData(input: {
    page: number;
    categoryId?: string;
    tagId?: string;
  }): Promise<PublicPostsPageData> {
    return withPublicQueryFallback(
      async () => {
        const filters = {
          status: "published",
          categoryId: input.categoryId,
          tagId: input.tagId,
        } satisfies postRepo.PostFilters;

        const totalPosts = await dependencies.getPostCount(filters);
        const totalPages = getTotalPages(totalPosts, PUBLIC_POSTS_PER_PAGE);

        if (input.page > totalPages) {
          return {
            posts: [],
            totalPosts,
            totalPages,
          };
        }

        const posts = await dependencies.findPublicPostCards({
          ...filters,
          order: "published",
          take: PUBLIC_POSTS_PER_PAGE,
          skip: (input.page - 1) * PUBLIC_POSTS_PER_PAGE,
        });

        return {
          posts: await attachCoverImagesToPosts(
            posts,
            dependencies.resolveMediaPresentationMap,
          ),
          totalPosts,
          totalPages,
        };
      },
      {
        posts: [],
        totalPosts: 0,
        totalPages: 1,
      },
    );
  };
}

const publicPostsPageDataQuery = createPublicPostsPageDataQuery();

export async function getPublicPostsPageData(input: {
  page: number;
  categoryId?: string;
  tagId?: string;
}): Promise<PublicPostsPageData> {
  return publicPostsPageDataQuery(input);
}
