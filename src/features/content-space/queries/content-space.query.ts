import {
  buildAdminPostsPageData,
  buildAdminPostsQueryContext,
  toWorkspacePostSummary,
  type AdminPostsPageQueryParams,
} from "@/features/content-space/lib/content-space-page-data";
import * as savedViewService from "@/features/content-space/services/content-space-saved-view.service";
import * as folderRepo from "@/features/content-space/repositories/folder.repository";
import {
  getAdminQuickEntryCounts,
  getAdminLibraryPostsPageData,
  getAdminRecentPostsPageData,
  getPostById,
  getPosts,
  getPostsByFolder,
  getReadyToPublishPosts as getReadyToPublishPostSummaries,
} from "@/features/posts/queries/post.queries";
import * as postRepo from "@/features/posts/repositories/post.repository";
import { getAdminSessionIdentity } from "@/infrastructure/auth/admin-session";
import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import {
  buildContentTree,
  type ContentTreeInput,
} from "@/features/content-space/lib/content-space-tree";
import type { ContentSpaceContextSources } from "@/features/content-space/lib/content-space-workspace";

export async function getContentTree() {
  return getContentTreeCached();
}

const getContentTreeCached = unstable_cache(
  async () => {
    const folders = await folderRepo.findFoldersWithPostPreviews();

    return buildContentTree({
      folders: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        sortOrder: folder.sortOrder,
        postCount: folder._count.posts,
      })),
      posts: folders.flatMap((folder) => folder.posts.map((post) => ({
        id: post.id,
        title: post.title,
        status: post.status,
        updatedAt: post.updatedAt,
        folderId: post.folderId,
      }))),
    } satisfies ContentTreeInput);
  },
  ["admin-content-tree"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.posts],
  },
);

export async function getDraftPosts(limit = 20) {
  if (limit === 20) {
    return getDraftPostsCached();
  }

  return postRepo.findDraftPosts(limit);
}

const getDraftPostsCached = unstable_cache(
  () => postRepo.findDraftPosts(20),
  ["admin-draft-posts"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.posts],
  },
);

export async function getReadyToPublishPosts(limit = 20) {
  return getReadyToPublishPostSummaries(limit);
}

async function buildSearchContextSources(input: {
  getPosts: typeof getPosts;
  shouldLoadSearchResults: boolean;
  searchFilters?: postRepo.FindPostsOptions;
}): Promise<Pick<ContentSpaceContextSources, "searchResults">> {
  return {
    searchResults: input.shouldLoadSearchResults && input.searchFilters
      ? (await input.getPosts(input.searchFilters)).map(toWorkspacePostSummary)
      : [],
  };
}

function buildRequestedPostContextSummary(
  requestedPost: NonNullable<Awaited<ReturnType<typeof getPostById>>>,
) {
  return toWorkspacePostSummary({
    id: requestedPost.id,
    title: requestedPost.title,
    status: requestedPost.status,
    updatedAt: requestedPost.updatedAt ?? new Date().toISOString(),
    excerpt: requestedPost.excerpt,
    coverImageUrl: requestedPost.coverImageUrl,
    seoTitle: requestedPost.seoTitle,
    seoDescription: requestedPost.seoDescription,
    folder: requestedPost.folder
      ? {
          id: requestedPost.folder.id,
          name: requestedPost.folder.name,
          slug: requestedPost.folder.slug,
        }
      : null,
  });
}

async function buildFolderContextSources(input: {
  getPostsByFolder: typeof getPostsByFolder;
  shouldLoadFolderPostsFromExplicitFolder: boolean;
  requestedFolderId?: string;
  requestedPost?: ContentSpaceContextSources["requestedPost"];
}): Promise<Pick<ContentSpaceContextSources, "folderPosts" | "requestedPost">> {
  const derivedFolderContextId =
    input.requestedPost?.folder?.id;
  const folderContextId = input.requestedFolderId ?? derivedFolderContextId;
  const shouldLoadFolderPosts =
    input.shouldLoadFolderPostsFromExplicitFolder || Boolean(derivedFolderContextId);
  const folderPosts = shouldLoadFolderPosts && folderContextId
    ? await input.getPostsByFolder(folderContextId)
    : [];

  return {
    folderPosts: folderPosts.map(toWorkspacePostSummary),
    requestedPost: input.requestedPost,
  };
}

type AdminPostsPageDataDependencies = {
  getAdminSessionIdentity: typeof getAdminSessionIdentity;
  getContentTree: typeof getContentTree;
  getAdminRecentPostsPageData: typeof getAdminRecentPostsPageData;
  getAdminLibraryPostsPageData: typeof getAdminLibraryPostsPageData;
  getDraftPosts: typeof getDraftPosts;
  getReadyToPublishPosts: typeof getReadyToPublishPosts;
  getAdminQuickEntryCounts: typeof getAdminQuickEntryCounts;
  getCategories: typeof getCategories;
  getTags: typeof getTags;
  getSavedContentViews: typeof savedViewService.getSavedContentViews;
  getPostById: typeof getPostById;
  getPosts: typeof getPosts;
  getPostsByFolder: typeof getPostsByFolder;
};

export function createAdminPostsPageDataQuery(
  dependencies: AdminPostsPageDataDependencies = {
    getAdminSessionIdentity,
    getContentTree,
    getAdminRecentPostsPageData,
    getAdminLibraryPostsPageData,
    getDraftPosts,
    getReadyToPublishPosts,
    getAdminQuickEntryCounts,
    getCategories,
    getTags,
    getSavedContentViews: savedViewService.getSavedContentViews,
    getPostById,
    getPosts,
    getPostsByFolder,
  },
) {
  return async function getAdminPostsPageData(
    params: AdminPostsPageQueryParams,
  ) {
    const session = await dependencies.getAdminSessionIdentity();
    const queryContext = buildAdminPostsQueryContext(params);
    const {
      requestedPage,
      requestedPostId,
      requestedFolderId,
      pageTarget,
      queryPlan,
      libraryFilters,
      searchFilters,
    } = queryContext;

    const [
      contentTree,
      feedPageData,
      draftPosts,
      readyToPublishPosts,
      quickEntryCounts,
      categories,
      tags,
      savedViews,
    ] = await Promise.all([
      dependencies.getContentTree(),
      pageTarget === "recent"
        ? dependencies.getAdminRecentPostsPageData({
            page: requestedPage,
          })
        : dependencies.getAdminLibraryPostsPageData({
            page: requestedPage,
            filters: libraryFilters,
          }),
      dependencies.getDraftPosts(20),
      dependencies.getReadyToPublishPosts(20),
      dependencies.getAdminQuickEntryCounts(),
      dependencies.getCategories(),
      dependencies.getTags(),
      dependencies.getSavedContentViews(session.id),
    ]);

    const requestedEditablePostForContext =
      queryPlan.shouldLoadRequestedPostForContext && requestedPostId
        ? await dependencies.getPostById(requestedPostId)
        : undefined;

    const [searchContextSources, folderContextSources] = await Promise.all([
      buildSearchContextSources({
        getPosts: dependencies.getPosts,
        shouldLoadSearchResults: queryPlan.shouldLoadSearchResults,
        searchFilters,
      }),
      buildFolderContextSources({
        getPostsByFolder: dependencies.getPostsByFolder,
        shouldLoadFolderPostsFromExplicitFolder:
          queryPlan.shouldLoadFolderPostsFromExplicitFolder,
        requestedFolderId,
        requestedPost: requestedEditablePostForContext
          ? buildRequestedPostContextSummary(requestedEditablePostForContext)
          : undefined,
      }),
    ]);

    const pageData = buildAdminPostsPageData({
      rawParams: params,
      contentTree,
      libraryPosts:
        pageTarget === "library"
          ? feedPageData.posts.map(toWorkspacePostSummary)
          : [],
      libraryPage: pageTarget === "library" ? feedPageData.currentPage : 1,
      libraryTotalPages: pageTarget === "library" ? feedPageData.totalPages : 1,
      libraryFeedTotalPosts:
        pageTarget === "library" ? feedPageData.totalPosts : quickEntryCounts.library,
      recentPosts:
        pageTarget === "recent"
          ? feedPageData.posts.map(toWorkspacePostSummary)
          : [],
      recentPage: pageTarget === "recent" ? feedPageData.currentPage : 1,
      recentTotalPages: pageTarget === "recent" ? feedPageData.totalPages : 1,
      recentFeedTotalPosts:
        pageTarget === "recent" ? feedPageData.totalPosts : quickEntryCounts.recent,
      draftPosts: draftPosts.map(toWorkspacePostSummary),
      readyToPublishPosts: readyToPublishPosts.map(toWorkspacePostSummary),
      folderPosts: folderContextSources.folderPosts,
      quickEntryCounts: {
        library: quickEntryCounts.library,
        recent: quickEntryCounts.recent,
        drafts: quickEntryCounts.drafts,
        ready: quickEntryCounts.ready,
      },
      searchResults: searchContextSources.searchResults,
      requestedPost: folderContextSources.requestedPost,
    });

    const selectedPost =
      pageData.state.mode === "edit" && pageData.state.selectedPostId
        ? requestedEditablePostForContext?.id === pageData.state.selectedPostId
          ? requestedEditablePostForContext
          : await dependencies.getPostById(pageData.state.selectedPostId)
        : undefined;

    return {
      ...pageData,
      tree: contentTree,
      categories,
      tags,
      savedViews,
      selectedPost: selectedPost ?? undefined,
    };
  };
}

const getAdminPostsPageDataQuery = createAdminPostsPageDataQuery();

export async function getAdminPostsPageData(
  params: AdminPostsPageQueryParams,
) {
  return getAdminPostsPageDataQuery(params);
}
