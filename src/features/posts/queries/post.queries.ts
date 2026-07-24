import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import {
  resolveMediaPresentationMap,
  type MediaPresentation,
} from "@/features/media/queries/media.queries";
import { getRecentPostOperationLogs } from "@/features/posts/queries/post-operation-log.query";
import {
  countReadyToPublishPosts,
  isReadyToPublishPost,
} from "@/features/posts/lib/post-publishability";
import { POST_GOVERNANCE_DEBT_DEFINITIONS } from "@/features/posts/lib/post-governance";
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

type PublicPostCardRecord = Awaited<ReturnType<typeof postRepo.findPublicPostCards>>[number];
type PublishedPostRecord = NonNullable<
  Awaited<ReturnType<typeof postRepo.findPublishedPostBySlug>>
>;
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
  recentActivity: Awaited<ReturnType<typeof getRecentPostOperationLogs>>;
}

export type AdminPostCounts = {
  snapshot: AdminPostMetricsSnapshot;
  derived: {
    ready: number;
  };
  drafts: number;
  review: number;
  ready: number;
  published: number;
  archived: number;
  uncategorized: number;
  untagged: number;
  unfiled: number;
  missingExcerpt: number;
  missingSeoTitle: number;
  missingSeoDescription: number;
};

export type AdminDashboardOverviewStats = Pick<
  AdminPostCounts,
  "published" | "drafts" | "review" | "ready" | "archived"
>;

export type AdminDashboardTaxonomyStats = {
  categories: number;
  tags: number;
};

export type AdminDashboardStatCard = {
  label: string;
  value: number;
  description: string;
  iconKey:
    | "post"
    | "folder"
    | "tag"
    | "trend";
  href: string;
};

export type AdminDashboardGovernanceStats = Pick<
  AdminPostCounts,
  | "uncategorized"
  | "untagged"
  | "unfiled"
  | "missingExcerpt"
  | "missingSeoTitle"
  | "missingSeoDescription"
>;

function buildCoverImagePresentation(
  coverImageUrl: string | null,
  mediaByUrl: Map<string, MediaPresentation>,
) {
  if (!coverImageUrl) {
    return undefined;
  }

  return mediaByUrl.get(coverImageUrl) ?? {
    url: coverImageUrl,
    width: null,
    height: null,
    alt: null,
  };
}

function attachCoverImageToPost<T extends { coverImageUrl: string | null }>(
  post: T,
  mediaByUrl: Map<string, MediaPresentation>,
) {
  const coverImage = buildCoverImagePresentation(post.coverImageUrl, mediaByUrl);

  if (!coverImage) {
    return post as T & { coverImage?: MediaPresentation };
  }

  return {
    ...post,
    coverImage,
  };
}

async function attachCoverImagesToPosts<T extends { coverImageUrl: string | null }>(
  posts: T[],
  resolveCoverMediaPresentationMap: ResolveMediaPresentationMap,
) {
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

  const mediaByUrl = await resolveCoverMediaPresentationMap([post.coverImageUrl]);
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
  resolveCoverMediaPresentationMap: ResolveMediaPresentationMap =
    resolveMediaPresentationMap,
) {
  return {
    async getPostBySlug(slug: string) {
      return withPublicQueryFallback(
        async () => attachCoverImageToPublishedPost(
          await repo.findPublishedPostBySlug(slug),
          resolveCoverMediaPresentationMap,
        ),
        null,
      );
    },
    async getPublishedForFeed(take?: number) {
      return withPublicQueryFallback(
        () => repo.findPublishedForFeed(take),
        [],
      );
    },
    async getPublishedSlugs() {
      return withPublicQueryFallback(
        () => repo.findPublishedSlugs(),
        [],
      );
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
  resolveCoverMediaPresentationMap: ResolveMediaPresentationMap =
    resolveMediaPresentationMap,
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
  "getAdminPostMetricsSnapshot" | "findDraftPublishabilityCandidates"
>;

export function createAdminPostCountsQuery(
  repo: AdminPostCountsRepository = postRepo,
) {
  return async function getAdminPostCounts(): Promise<AdminPostCounts> {
    const [metrics, draftCandidates] = await Promise.all([
      repo.getAdminPostMetricsSnapshot(),
      repo.findDraftPublishabilityCandidates(),
    ]);
    const ready = metrics.review + countReadyToPublishPosts(draftCandidates);

    return {
      snapshot: metrics,
      derived: {
        ready,
      },
      ...metrics,
      ready,
    };
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
    drafts: counts.drafts,
    review: counts.review,
    ready: counts.ready,
    archived: counts.archived,
  };
}

export function projectAdminDashboardGovernanceStats(
  counts: AdminPostCounts,
): AdminDashboardGovernanceStats {
  return {
    uncategorized: counts.uncategorized,
    untagged: counts.untagged,
    unfiled: counts.unfiled,
    missingExcerpt: counts.missingExcerpt,
    missingSeoTitle: counts.missingSeoTitle,
    missingSeoDescription: counts.missingSeoDescription,
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

function getAdminDashboardGovernanceIconKey(
  key: keyof AdminDashboardGovernanceStats,
): AdminDashboardStatCard["iconKey"] {
  if (key === "uncategorized") {
    return "folder";
  }

  if (key === "untagged") {
    return "tag";
  }

  return "post";
}

export function projectAdminDashboardStatCards(input: {
  overview: AdminDashboardOverviewStats;
  taxonomy: AdminDashboardTaxonomyStats;
  governance: AdminDashboardGovernanceStats;
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
      label: "草稿",
      value: input.overview.drafts,
      description: "仍在编辑中的内容",
      iconKey: "trend",
      href: "/admin/posts",
    },
    {
      label: "待发布",
      value: input.overview.ready,
      description: "进入最终检查的文章",
      iconKey: "trend",
      href: "/admin/posts",
    },
    {
      label: "已归档",
      value: input.overview.archived,
      description: "已下线但可恢复的文章",
      iconKey: "post",
      href: "/admin/posts",
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
    ...POST_GOVERNANCE_DEBT_DEFINITIONS.map((definition) => ({
      label: definition.label,
      value: input.governance[definition.key],
      description: definition.description,
      iconKey: getAdminDashboardGovernanceIconKey(definition.key),
      href: "/admin/posts",
    })),
  ];
}

type AdminDashboardPageDataDependencies = {
  isProductionBuildPhase: () => boolean;
  getOverviewStats: () => Promise<AdminDashboardOverviewStats>;
  getGovernanceStats: () => Promise<AdminDashboardGovernanceStats>;
  getCategories: () => Promise<Array<{ id: string }>>;
  getTags: () => Promise<Array<{ id: string }>>;
  getRecentActivity: (take: number) => Promise<AdminDashboardPageData["recentActivity"]>;
};

export function createAdminDashboardPageDataQuery(
  dependencies: Partial<AdminDashboardPageDataDependencies> = {
    isProductionBuildPhase,
    getOverviewStats: getAdminDashboardOverviewStats,
    getGovernanceStats: getAdminDashboardGovernanceStats,
    getCategories: () => getCategories("admin"),
    getTags: () => getTags("admin"),
    getRecentActivity: getRecentPostOperationLogs,
  },
) {
  const resolvedDependencies: AdminDashboardPageDataDependencies = {
    isProductionBuildPhase,
    getOverviewStats: getAdminDashboardOverviewStats,
    getGovernanceStats: getAdminDashboardGovernanceStats,
    getCategories: () => getCategories("admin"),
    getTags: () => getTags("admin"),
    getRecentActivity: getRecentPostOperationLogs,
    ...dependencies,
  };

  return async function getAdminDashboardPageData(
    recentActivityTake = 8,
  ): Promise<AdminDashboardPageData> {
    if (resolvedDependencies.isProductionBuildPhase()) {
      return {
        statCards: [],
        recentActivity: [],
      };
    }

    const [
      overview,
      governance,
      categories,
      tags,
      recentActivity,
    ] = await Promise.all([
      resolvedDependencies.getOverviewStats(),
      resolvedDependencies.getGovernanceStats(),
      resolvedDependencies.getCategories(),
      resolvedDependencies.getTags(),
      resolvedDependencies.getRecentActivity(recentActivityTake),
    ]);

    const taxonomy = projectAdminDashboardTaxonomyStats({
      categories: categories.length,
      tags: tags.length,
    });

    return {
      statCards: projectAdminDashboardStatCards({
        overview,
        taxonomy,
        governance,
      }),
      recentActivity,
    };
  };
}

const getAdminDashboardPageDataQuery = createAdminDashboardPageDataQuery();

export async function getAdminDashboardPageData(
  recentActivityTake = 8,
): Promise<AdminDashboardPageData> {
  return getAdminDashboardPageDataQuery(recentActivityTake);
}

export async function getAdminDashboardGovernanceStats(): Promise<AdminDashboardGovernanceStats> {
  return projectAdminDashboardGovernanceStats(await getAdminPostCounts());
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
