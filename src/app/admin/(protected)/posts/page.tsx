import { ContentSpaceShell } from "@/components/admin/content-space-shell";
import { getAdminPostsPageData } from "@/features/content-space/queries/content-space.query";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    postId?: string | string[];
    view?: string | string[];
    folder?: string | string[];
    status?: string | string[];
    q?: string | string[];
  }>;
}) {
  const pageData = await getAdminPostsPageData(await searchParams);

  return (
    <ContentSpaceShell
      tree={pageData.tree}
      activeFolder={pageData.activeFolder}
      selectedPost={pageData.selectedPost}
      selectedPostId={pageData.selectedPostId}
      contextPosts={pageData.contextPosts}
      folderStatusCounts={pageData.folderStatusCounts}
      statusFilter={pageData.statusFilter}
      categories={pageData.categories}
      tags={pageData.tags}
      searchQuery={pageData.searchQuery}
      mode={pageData.mode}
    />
  );
}
