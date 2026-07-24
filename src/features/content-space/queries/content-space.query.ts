import * as folderRepo from "@/features/content-space/repositories/folder.repository";
import {
  getPostById,
  getPosts,
} from "@/features/posts/queries/post.queries";
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

export type AdminPostsPageQueryParams = {
  postId?: string | string[];
  view?: string | string[];
  folder?: string | string[];
  status?: string | string[];
  q?: string | string[];
};

export type FolderPostStatusFilter =
  | "all"
  | "internal"
  | "published";

export type FolderPostStatusCounts = {
  all: number;
  internal: number;
  published: number;
};

function toContextPostSummary(post: {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
}) {
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

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatusFilter(value: string | undefined): FolderPostStatusFilter {
  if (value === "published") return "published";
  if (value === "internal" || value === "draft") {
    return "internal";
  }
  return "all";
}

function matchesSearch(
  post: {
    title: string;
    excerpt?: string | null;
    contentText?: string | null;
  },
  query: string,
) {
  if (!query) return true;

  const haystack = [post.title, post.excerpt, post.contentText]
    .filter(Boolean)
    .join("\n")
    .toLocaleLowerCase();

  return haystack.includes(query.toLocaleLowerCase());
}

function countFolderStatuses(
  posts: Array<{ status: string }>,
): FolderPostStatusCounts {
  return posts.reduce<FolderPostStatusCounts>(
    (counts, post) => {
      counts.all += 1;
      if (post.status !== "published") counts.internal += 1;
      if (post.status === "published") counts.published += 1;
      return counts;
    },
    { all: 0, internal: 0, published: 0 },
  );
}

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
      posts: folders.flatMap((folder) =>
        folder.posts.map((post) => ({
          id: post.id,
          title: post.title,
          status: post.status,
          updatedAt: post.updatedAt,
          folderId: post.folderId,
        })),
      ),
    } satisfies ContentTreeInput);
  },
  ["admin-content-tree"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.posts],
  },
);

type AdminPostsPageDataDependencies = {
  getContentTree: typeof getContentTree;
  getCategories: typeof getCategories;
  getTags: typeof getTags;
  getPostById: typeof getPostById;
  getPosts: typeof getPosts;
} & Record<string, unknown>;

export function createAdminPostsPageDataQuery(
  dependencies: AdminPostsPageDataDependencies = {
    getContentTree,
    getCategories,
    getTags,
    getPostById,
    getPosts,
  },
) {
  return async function getAdminPostsPageData(
    rawParams: AdminPostsPageQueryParams,
  ) {
    const requestedFolderId = firstParam(rawParams.folder)?.trim() || undefined;
    const requestedPostId = firstParam(rawParams.postId)?.trim() || undefined;
    const searchQuery = firstParam(rawParams.q)?.trim() ?? "";
    const statusFilter = normalizeStatusFilter(firstParam(rawParams.status));
    const requestedMode = firstParam(rawParams.view) === "new" ? "new" : "edit";

    const [tree, categories, tags, requestedPost] = await Promise.all([
      dependencies.getContentTree(),
      dependencies.getCategories(),
      dependencies.getTags(),
      requestedPostId ? dependencies.getPostById(requestedPostId) : undefined,
    ]);

    const explicitFolder = requestedFolderId
      ? tree.find((folder) => folder.id === requestedFolderId)
      : undefined;
    const requestedPostFolder = requestedPost?.folder
      ? tree.find((folder) => folder.id === requestedPost.folder?.id)
      : undefined;
    const activeFolderNode = explicitFolder ?? requestedPostFolder ?? tree[0];
    const activeFolder = activeFolderNode
      ? {
          id: activeFolderNode.id,
          name: activeFolderNode.name,
          slug: activeFolderNode.slug,
        }
      : undefined;
    const mode: "new" | "edit" = activeFolder && requestedMode === "new" ? "new" : "edit";

    const folderPosts = activeFolder
      ? await dependencies.getPosts({
        folderId: activeFolder.id,
        order: "created",
      })
      : [];
    const folderStatusCounts = countFolderStatuses(folderPosts);
    const visiblePosts = folderPosts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "internal"
          ? post.status !== "published"
          : post.status === "published");
      return matchesStatus && matchesSearch(post, searchQuery);
    });
    const contextPosts = visiblePosts.map(toContextPostSummary);
    const selectedPostId =
      mode === "new"
        ? undefined
        : requestedPostId && contextPosts.some((post) => post.id === requestedPostId)
          ? requestedPostId
          : contextPosts[0]?.id;
    const selectedPost = selectedPostId
      ? requestedPost?.id === selectedPostId
        ? requestedPost
        : await dependencies.getPostById(selectedPostId)
      : undefined;

    return {
      tree,
      activeFolder,
      selectedPost: selectedPost ?? undefined,
      selectedPostId,
      contextPosts,
      folderStatusCounts,
      statusFilter,
      categories,
      tags,
      searchQuery,
      mode,
    };
  };
}

const getAdminPostsPageDataQuery = createAdminPostsPageDataQuery();

export async function getAdminPostsPageData(
  params: AdminPostsPageQueryParams,
) {
  return getAdminPostsPageDataQuery(params);
}
