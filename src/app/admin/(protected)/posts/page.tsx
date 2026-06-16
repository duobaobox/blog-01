import { ContentSpaceShell } from "@/components/admin/content-space-shell";
import {
  getAdminPostsPageData,
} from "@/features/content-space/queries/content-space.query";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    postId?: string;
    view?: string;
    page?: string | string[];
    entry?: string | string[];
    folder?: string | string[];
    status?: string | string[];
    categoryId?: string | string[];
    tagId?: string | string[];
    q?: string | string[];
  }>;
}) {
  const pageData = await getAdminPostsPageData(await searchParams);

  return (
    <ContentSpaceShell
      params={pageData.params}
      tree={pageData.tree}
      quickEntryCounts={pageData.quickEntryCounts}
      activeEntry={pageData.state.entry}
      activeFolder={pageData.state.activeFolder}
      selectedPost={pageData.selectedPost}
      selectedPostId={pageData.state.selectedPostId}
      contextPosts={pageData.contextPosts}
      libraryFilters={pageData.libraryFilters}
      libraryPage={pageData.libraryPage}
      libraryTotalPages={pageData.libraryTotalPages}
      libraryTotalPosts={pageData.libraryFeedTotalPosts}
      recentPage={pageData.recentPage}
      recentTotalPages={pageData.recentTotalPages}
      recentTotalPosts={pageData.recentFeedTotalPosts}
      categories={pageData.categories}
      tags={pageData.tags}
      savedViews={pageData.savedViews}
      searchQuery={pageData.state.searchQuery}
      mode={pageData.state.mode}
    />
  );
}
