export type RevalidationPost = {
  status?: string | null;
  slug?: string | null;
  category?: {
    slug?: string | null;
  } | null;
  tags?: Array<{
    tag?: {
      slug?: string | null;
    } | null;
  }> | null;
};

export function getPostCreatePublicRevalidationPosts(post: RevalidationPost) {
  return post.status === "published" ? [post] : [];
}

export function getPostUpdatePublicRevalidationPosts(input: {
  previousPost: RevalidationPost;
  nextPost: RevalidationPost;
}) {
  return input.previousPost.status === "published" ||
    input.nextPost.status === "published"
    ? [input.previousPost, input.nextPost]
    : [];
}

export function getPostDeletePublicRevalidationPosts(input: {
  previousStatus: string;
  deletedPost: RevalidationPost;
}) {
  return input.previousStatus === "published" ? [input.deletedPost] : [];
}

export function getPostBulkUpdatePublicRevalidationPosts(input: {
  previousPosts: RevalidationPost[];
  nextPosts: RevalidationPost[];
}) {
  const postsToRefresh: RevalidationPost[] = [];

  for (const post of input.previousPosts) {
    if (post.status === "published") {
      postsToRefresh.push(post);
    }
  }

  for (const post of input.nextPosts) {
    if (post.status === "published") {
      postsToRefresh.push(post);
    }
  }

  return postsToRefresh;
}
