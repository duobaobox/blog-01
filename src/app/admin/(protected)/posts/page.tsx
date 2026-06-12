export const dynamic = "force-dynamic";

import { ContentSpaceShell } from "@/components/admin/content-space-shell";
import type {
  ContentSpaceContextPost,
  ContentSpaceSubtopicGroup,
} from "@/components/admin/content-space-types";
import {
  getContentTree,
  getDraftPosts,
  getReadyToPublishPosts,
  getRecentEditedPosts,
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

function toWorkspacePostSummary(post: Awaited<ReturnType<typeof getRecentEditedPosts>>[number]): WorkspacePostSummary {
  return {
    id: post.id,
    title: post.title,
    status: post.status,
    updatedAt: post.updatedAt,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    subtopic: post.subtopic
      ? {
          id: post.subtopic.id,
          name: post.subtopic.name,
          slug: post.subtopic.slug,
          topic: {
            id: post.subtopic.topic.id,
            name: post.subtopic.topic.name,
            slug: post.subtopic.topic.slug,
          },
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
    topic?: string | string[];
    subtopic?: string | string[];
    q?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const query = parseQueryParam(params.q);
  const requestedPostId = parseSingleParam(params.postId);

  const [contentTree, recentEdited, draftPosts, readyToPublishPosts, categories, tags] =
    await Promise.all([
      getContentTree(),
      getRecentEditedPosts(12),
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
      })
    : [];

  const requestedPost = requestedPostId
    ? await getPostById(requestedPostId)
    : undefined;

  const state = resolveContentSpaceState({
    params: {
      entry: parseSingleParam(params.entry),
      topic: parseSingleParam(params.topic),
      subtopic: parseSingleParam(params.subtopic),
      postId: requestedPostId,
      view: parseSingleParam(params.view),
      q: query,
    },
    contentTree,
    recentEdited: recentEdited.map(toWorkspacePostSummary),
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
            subtopic: requestedPost.subtopic
              ? {
                  id: requestedPost.subtopic.id,
                name: requestedPost.subtopic.name,
                slug: requestedPost.subtopic.slug,
                topic: {
                  id: requestedPost.subtopic.topic.id,
                  name: requestedPost.subtopic.topic.name,
                  slug: requestedPost.subtopic.topic.slug,
                },
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

  const subtopicGroups: ContentSpaceSubtopicGroup[] = contentTree.map((topic) => ({
    topicId: topic.id,
    topicName: topic.name,
    subtopics: topic.subtopics.map((subtopic) => ({
      id: subtopic.id,
      name: subtopic.name,
    })),
  }));

  const contextPosts: ContentSpaceContextPost[] = state.contextPosts;

  return (
    <ContentSpaceShell
      params={{
        entry: parseSingleParam(params.entry),
        topic: parseSingleParam(params.topic),
        subtopic: parseSingleParam(params.subtopic),
        postId: requestedPostId,
        view: parseSingleParam(params.view),
        q: query,
      }}
      tree={contentTree}
      quickEntryCounts={{
        recent: recentEdited.length,
        drafts: draftPosts.length,
        ready: readyToPublishPosts.length,
      }}
      activeEntry={state.entry}
      activeTopic={state.activeTopic}
      activeSubtopic={state.activeSubtopic}
      selectedPost={selectedPost ?? undefined}
      selectedPostId={state.selectedPostId}
      contextPosts={contextPosts}
      categories={categories}
      tags={tags}
      subtopicGroups={subtopicGroups}
      searchQuery={state.searchQuery}
      mode={state.mode}
    />
  );
}
