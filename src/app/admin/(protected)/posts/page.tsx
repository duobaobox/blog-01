export const dynamic = "force-dynamic";

import { ContentSpaceShell } from "@/components/admin/content-space-shell";
import type {
  ContentSpaceContextPost,
  ContentSpaceFolderOption,
} from "@/components/admin/content-space-types";
import {
  getContentTree,
  getAllPosts,
  getDraftPosts,
  getReadyToPublishPosts,
} from "@/features/content-space/queries/content-space.query";
import {
  resolveContentSpaceState,
  type WorkspacePostSummary,
} from "@/features/content-space/lib/content-space-workspace";
import { getPostById, getPosts } from "@/features/posts/queries/post.queries";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";

function parseQueryParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function parseSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toWorkspacePostSummary(post: Awaited<ReturnType<typeof getAllPosts>>[number]): WorkspacePostSummary {
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

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    postId?: string;
    view?: string;
    page?: string | string[];
    entry?: string | string[];
    folder?: string | string[];
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = parseQueryParam(params.q);
  const requestedPostId = parseSingleParam(params.postId);
  const requestedFolderId = parseSingleParam(params.folder);

  const [contentTree, allPosts, draftPosts, readyToPublishPosts, categories, tags] =
    await Promise.all([
      getContentTree(),
      getAllPosts(200),
      getDraftPosts(20),
      getReadyToPublishPosts(20),
      getCategories(),
      getTags(),
    ]);

  const searchResults = query
    ? await getPosts({
        query,
        take: 20,
        order: "updated",
        folderId: requestedFolderId || undefined,
      })
    : [];

  const requestedPost = requestedPostId
    ? await getPostById(requestedPostId)
    : undefined;

  const state = resolveContentSpaceState({
      params: {
        entry: parseSingleParam(params.entry),
        folder: requestedFolderId,
        postId: requestedPostId,
        view: parseSingleParam(params.view),
        q: query,
    },
    contentTree,
    allPosts: allPosts.map(toWorkspacePostSummary),
    draftPosts: draftPosts.map(toWorkspacePostSummary),
    readyToPublishPosts: readyToPublishPosts.map(toWorkspacePostSummary),
    searchResults: searchResults.map(toWorkspacePostSummary),
    requestedPost: requestedPost
        ? {
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
        }
      : undefined,
  });

  const selectedPost =
    state.mode === "edit" && state.selectedPostId
      ? requestedPost?.id === state.selectedPostId
        ? requestedPost
        : await getPostById(state.selectedPostId)
      : undefined;

  const folderOptions: ContentSpaceFolderOption[] = contentTree.map((folder) => ({
    id: folder.id,
    name: folder.name,
  }));

  const contextPosts: ContentSpaceContextPost[] = state.contextPosts;

  return (
    <ContentSpaceShell
      params={{
        entry: parseSingleParam(params.entry),
        folder: requestedFolderId,
        postId: requestedPostId,
        view: parseSingleParam(params.view),
        q: query,
      }}
      tree={contentTree}
      quickEntryCounts={{
        all: allPosts.length,
        drafts: draftPosts.length,
        ready: readyToPublishPosts.length,
      }}
      activeEntry={state.entry}
      activeFolder={state.activeFolder}
      selectedPost={selectedPost ?? undefined}
      selectedPostId={state.selectedPostId}
      contextPosts={contextPosts}
      categories={categories}
      tags={tags}
      folderOptions={folderOptions}
      searchQuery={state.searchQuery}
      mode={state.mode}
    />
  );
}
