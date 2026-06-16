import {
  getPostCreatePublicRevalidationPosts,
  getPostBulkUpdatePublicRevalidationPosts,
  getPostDeletePublicRevalidationPosts,
  getPostUpdatePublicRevalidationPosts,
  type RevalidationPost,
} from "@/features/posts/lib/post-revalidation";

export type PostActionWorkflowResult = {
  revalidateAdminPosts: boolean;
  publicPostsToRevalidate: RevalidationPost[];
};

export function buildCreatePostWorkflow(post: RevalidationPost): PostActionWorkflowResult {
  return {
    revalidateAdminPosts: true,
    publicPostsToRevalidate: getPostCreatePublicRevalidationPosts(post),
  };
}

export function buildCreateEmptyPostWorkflow(): PostActionWorkflowResult {
  return {
    revalidateAdminPosts: true,
    publicPostsToRevalidate: [],
  };
}

export function buildUpdatePostWorkflow(input: {
  previousPost: RevalidationPost;
  nextPost: RevalidationPost;
}): PostActionWorkflowResult {
  return {
    revalidateAdminPosts: true,
    publicPostsToRevalidate: getPostUpdatePublicRevalidationPosts(input),
  };
}

export function buildDeletePostWorkflow(input: {
  previousStatus: string;
  deletedPost: RevalidationPost;
}): PostActionWorkflowResult {
  return {
    revalidateAdminPosts: true,
    publicPostsToRevalidate: getPostDeletePublicRevalidationPosts(input),
  };
}

export function buildBulkUpdatePostsWorkflow(input: {
  previousPosts: RevalidationPost[];
  updatedPosts: RevalidationPost[];
}): PostActionWorkflowResult {
  return {
    revalidateAdminPosts: true,
    publicPostsToRevalidate: getPostBulkUpdatePublicRevalidationPosts({
      previousPosts: input.previousPosts,
      nextPosts: input.updatedPosts,
    }),
  };
}
