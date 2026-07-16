import { parsePageParam } from "@/features/posts/lib/pagination";
import type { ContentSpaceContextPost } from "@/components/admin/content-space-types";
import type { ContentTreeFolder } from "@/features/content-space/lib/content-space-tree";
import {
  buildContentContextSummary,
  type ContentContextSummary,
} from "@/features/content-space/lib/content-space-context";
import {
  isPostGovernanceDebtKey,
  type PostGovernanceDebtKey,
} from "@/features/posts/lib/post-governance";
import {
  resolveContentSpaceState,
  type ContentSpaceContextSources,
  type ContentLibraryFilters,
  type ContentSpaceParams,
  type WorkspacePostSummary,
} from "@/features/content-space/lib/content-space-workspace";
import type { AdminQuickEntryCounts } from "@/features/posts/queries/post.queries";
import type { FindPostsOptions } from "@/features/posts/repositories/post.repository";
import { isPostStatus, type PostStatus } from "@/features/posts/lib/post-write";
import { buildContentSpaceQueryPlan } from "@/features/content-space/lib/content-space-query-plan";

export type AdminPostsPageQueryParams = {
  postId?: string | string[];
  view?: string | string[];
  page?: string | string[];
  entry?: string | string[];
  folder?: string | string[];
  status?: string | string[];
  categoryId?: string | string[];
  tagId?: string | string[];
  debt?: string | string[];
  q?: string | string[];
};

export function parseAdminPostsPageParam(value: string | string[] | undefined) {
  return parsePageParam(value) ?? 1;
}

export type AdminPostsPageSelectedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: unknown;
  contentText: string;
  status: string;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string;
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  coverImageUrl: string | null;
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export function parseContentSpaceQueryParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function parseContentSpaceSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export type AdminPostsQueryContext = {
  params: ContentSpaceParams;
  requestedPage: number;
  requestedPostId?: string;
  requestedFolderId?: string;
  requestedEntry?: string;
  resolvedStatus?: PostStatus;
  resolvedDebt?: PostGovernanceDebtKey;
  pageTarget: "library" | "recent";
  queryPlan: ReturnType<typeof buildContentSpaceQueryPlan>;
  libraryFilters?: FindPostsOptions;
  searchFilters?: FindPostsOptions;
};

export type AdminPostsFeedSummary = {
  totalPosts: number;
  page: number;
  totalPages: number;
};

function buildGovernanceFilters(
  resolvedDebt?: PostGovernanceDebtKey,
): Pick<
  FindPostsOptions,
  | "missingCategory"
  | "missingTags"
  | "missingFolder"
  | "missingExcerpt"
  | "missingSeoTitle"
  | "missingSeoDescription"
> {
  return {
    missingCategory: resolvedDebt === "uncategorized" || undefined,
    missingTags: resolvedDebt === "untagged" || undefined,
    missingFolder: resolvedDebt === "unfiled" || undefined,
    missingExcerpt: resolvedDebt === "missingExcerpt" || undefined,
    missingSeoTitle: resolvedDebt === "missingSeoTitle" || undefined,
    missingSeoDescription: resolvedDebt === "missingSeoDescription" || undefined,
  };
}

export function buildAdminPostsQueryContext(
  rawParams: AdminPostsPageQueryParams,
): AdminPostsQueryContext {
  const query = parseContentSpaceQueryParam(rawParams.q);
  const requestedPostId = parseContentSpaceSingleParam(rawParams.postId);
  const requestedFolderId = parseContentSpaceSingleParam(rawParams.folder);
  const requestedPage = parseAdminPostsPageParam(rawParams.page);
  const requestedEntry = parseContentSpaceSingleParam(rawParams.entry);
  const requestedStatus = parseContentSpaceSingleParam(rawParams.status);
  const requestedCategoryId = parseContentSpaceSingleParam(rawParams.categoryId);
  const requestedTagId = parseContentSpaceSingleParam(rawParams.tagId);
  const requestedDebt = parseContentSpaceSingleParam(rawParams.debt);
  const resolvedStatus = isPostStatus(requestedStatus)
    ? requestedStatus
    : undefined;
  const resolvedDebt = isPostGovernanceDebtKey(requestedDebt)
    ? requestedDebt
    : undefined;
  const params: ContentSpaceParams = {
    entry: requestedEntry,
    folder: requestedFolderId,
    postId: requestedPostId,
    view: parseContentSpaceSingleParam(rawParams.view),
    page: String(requestedPage),
    status: requestedStatus,
    categoryId: requestedCategoryId,
    tagId: requestedTagId,
    debt: requestedDebt,
    q: query,
  };
  const queryPlan = buildContentSpaceQueryPlan({
    query,
    requestedEntry,
    requestedFolderId,
    requestedPostId,
  });
  const sharedFilters = {
    status: resolvedStatus,
    categoryId: requestedCategoryId || undefined,
    tagId: requestedTagId || undefined,
    ...buildGovernanceFilters(resolvedDebt),
  } satisfies FindPostsOptions;

  return {
    params,
    requestedPage,
    requestedPostId,
    requestedFolderId,
    requestedEntry,
    resolvedStatus,
    resolvedDebt,
    pageTarget: queryPlan.pageTarget,
    queryPlan,
    libraryFilters:
      queryPlan.pageTarget === "library"
        ? sharedFilters
        : undefined,
    searchFilters: {
      query,
      take: 20,
      order: "updated",
      folderId: requestedFolderId || undefined,
      ...sharedFilters,
    },
  };
}

export function toWorkspacePostSummary(
  post: Pick<
    WorkspacePostSummary,
    | "id"
    | "title"
    | "status"
    | "updatedAt"
    | "excerpt"
    | "coverImageUrl"
    | "seoTitle"
    | "seoDescription"
    | "folder"
  >,
): WorkspacePostSummary {
  return {
    id: post.id,
    title: post.title,
    status: post.status,
    updatedAt: post.updatedAt,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    folder: post.folder
      ? {
          id: post.folder.id,
          name: post.folder.name,
          slug: post.folder.slug,
        }
      : null,
  };
}

type BuildAdminPostsPageDataInput = {
  rawParams: AdminPostsPageQueryParams;
  contentTree: ContentTreeFolder[];
  libraryPosts: WorkspacePostSummary[];
  libraryPage: number;
  libraryTotalPages: number;
  libraryFeedTotalPosts: number;
  recentPosts: WorkspacePostSummary[];
  recentPage: number;
  recentTotalPages: number;
  recentFeedTotalPosts: number;
  draftPosts: WorkspacePostSummary[];
  readyToPublishPosts: WorkspacePostSummary[];
  folderPosts?: WorkspacePostSummary[];
  quickEntryCounts: AdminQuickEntryCounts;
  searchResults: WorkspacePostSummary[];
  requestedPost?: WorkspacePostSummary | null;
};

export function buildAdminPostsPageData({
  rawParams,
  contentTree,
  libraryPosts,
  libraryPage,
  libraryTotalPages,
  libraryFeedTotalPosts,
  recentPosts,
  recentPage,
  recentTotalPages,
  recentFeedTotalPosts,
  draftPosts,
  readyToPublishPosts,
  folderPosts,
  quickEntryCounts,
  searchResults,
  requestedPost,
}: BuildAdminPostsPageDataInput) {
  const queryContext = buildAdminPostsQueryContext(rawParams);
  const { params, requestedPostId, requestedFolderId } = queryContext;

  const state = resolveContentSpaceState({
    params,
    contentTree,
    libraryPosts,
    recentPosts,
    draftPosts,
    readyToPublishPosts,
    contextSources: {
      folderPosts,
      searchResults,
      requestedPost,
    } satisfies ContentSpaceContextSources,
  });

  const normalizedDebt = isPostGovernanceDebtKey(params.debt)
    ? (params.debt as PostGovernanceDebtKey)
    : undefined;
  const contextSummary = buildContentContextSummary({
    entry: state.entry,
    folderName: state.activeFolder?.name,
    searchQuery: queryContext.params.q ?? "",
    posts: state.contextPosts,
  });

  return {
    params,
    libraryPage,
    libraryTotalPages,
    libraryFeedTotalPosts,
    recentPage,
    recentTotalPages,
    recentFeedTotalPosts,
    requestedPostId,
    requestedFolderId,
    state,
    contextSummary: contextSummary satisfies ContentContextSummary,
    searchQuery: queryContext.params.q ?? "",
    libraryFilters: {
      status: params.status || undefined,
      categoryId: params.categoryId || undefined,
      tagId: params.tagId || undefined,
      debt: normalizedDebt,
    } satisfies ContentLibraryFilters,
    contextPosts: state.contextPosts satisfies ContentSpaceContextPost[],
    quickEntryCounts,
    feedSummaries: {
      library: {
        totalPosts: libraryFeedTotalPosts,
        page: libraryPage,
        totalPages: libraryTotalPages,
      },
      recent: {
        totalPosts: recentFeedTotalPosts,
        page: recentPage,
        totalPages: recentTotalPages,
      },
    } satisfies {
      library: AdminPostsFeedSummary;
      recent: AdminPostsFeedSummary;
    },
  };
}
