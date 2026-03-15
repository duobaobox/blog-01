export const dynamic = "force-dynamic";

import { getPosts } from "@/features/posts/queries/post.queries";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import { PostsWorkspace } from "@/components/admin/posts-workspace";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ postId?: string; view?: string }>;
}) {
  const params = await searchParams;
  const [posts, categories, tags] = await Promise.all([
    getPosts(),
    getCategories(),
    getTags(),
  ]);

  const requestedPostId =
    typeof params.postId === "string" ? params.postId : undefined;
  const requestedView = params.view === "new" ? "new" : "edit";
  const showEmptyState = posts.length === 0 && requestedView !== "new";
  const fallbackPostId = posts[0]?.id;
  const selectedPostId =
    requestedView === "new" || posts.length === 0
      ? undefined
      : posts.find((post) => post.id === requestedPostId)?.id ?? fallbackPostId;
  const mode = requestedView === "new" ? "new" : "edit";

  return (
    <PostsWorkspace
      posts={posts}
      categories={categories}
      tags={tags}
      mode={mode}
      selectedPostId={selectedPostId}
      showEmptyState={showEmptyState}
    />
  );
}
