export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import {
  getPostById,
  getPostCount,
  getPosts,
} from "@/features/posts/queries/post.queries";
import {
  getTotalPages,
  parsePageParam,
  PUBLIC_POSTS_PER_PAGE,
} from "@/features/posts/lib/pagination";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import { PostsWorkspace } from "@/components/admin/posts-workspace";

type StatusFilter = "all" | "published" | "draft";

function parseStatusFilter(value: string | string[] | undefined): StatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "published" || raw === "draft" ? raw : "all";
}

function parseQueryParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    postId?: string;
    view?: string;
    page?: string | string[];
    status?: string | string[];
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const currentPage = parsePageParam(params.page);
  if (!currentPage) {
    notFound();
  }

  const status = parseStatusFilter(params.status);
  const query = parseQueryParam(params.q);
  const statusValue = status === "all" ? undefined : status;

  const [totalPosts, categories, tags] = await Promise.all([
    getPostCount({
      status: statusValue,
      query,
    }),
    getCategories(),
    getTags(),
  ]);
  const totalPages = getTotalPages(totalPosts, PUBLIC_POSTS_PER_PAGE);

  if (currentPage > totalPages) {
    notFound();
  }

  const posts = await getPosts({
    status: statusValue,
    query,
    take: PUBLIC_POSTS_PER_PAGE,
    skip: (currentPage - 1) * PUBLIC_POSTS_PER_PAGE,
    order: "updated",
  });

  const requestedPostId =
    typeof params.postId === "string" ? params.postId : undefined;
  const requestedView = params.view === "new" ? "new" : "edit";
  const showEmptyState = posts.length === 0 && requestedView !== "new";
  const hasActiveFilters = status !== "all" || query.length > 0;
  const fallbackPostId = posts[0]?.id;
  const selectedPostId =
    requestedView === "new" || posts.length === 0
      ? undefined
      : posts.find((post) => post.id === requestedPostId)?.id ?? fallbackPostId;
  const mode = requestedView === "new" ? "new" : "edit";
  const selectedPost = selectedPostId
    ? await getPostById(selectedPostId)
    : undefined;

  return (
    <PostsWorkspace
      posts={posts}
      selectedPost={selectedPost ?? undefined}
      categories={categories}
      tags={tags}
      mode={mode}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPosts={totalPosts}
      initialSearch={query}
      initialStatus={status}
      showEmptyState={showEmptyState}
      hasActiveFilters={hasActiveFilters}
      emptyStateTitle={hasActiveFilters ? "没有匹配文章" : "还没有文章"}
      emptyStateDescription={
        hasActiveFilters
          ? "换个关键词或切换状态试试。"
          : "先创建第一篇文章，之后它会出现在左侧列表。"
      }
    />
  );
}
