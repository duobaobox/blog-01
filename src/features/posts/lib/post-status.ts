export type PostStatusLike = {
  status?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type PostStatusSummary = {
  internalCount: number;
  publishedCount: number;
};

export function isInternalPost(post: Pick<PostStatusLike, "status">) {
  return post.status !== "published";
}

export function isPublishedPost(post: Pick<PostStatusLike, "status">) {
  return post.status === "published";
}

export function getPostStatusLabel(post: Pick<PostStatusLike, "status">) {
  if (isPublishedPost(post)) {
    return "已发布";
  }

  return "内部";
}

export function getPostStatusTone(post: Pick<PostStatusLike, "status">) {
  if (isPublishedPost(post)) {
    return "published" as const;
  }

  return "internal" as const;
}

export function summarizePostStatuses(
  posts: Array<Pick<PostStatusLike, "status">>,
): PostStatusSummary {
  return posts.reduce<PostStatusSummary>(
    (summary, post) => {
      if (isPublishedPost(post)) {
        summary.publishedCount += 1;
      } else {
        summary.internalCount += 1;
      }

      return summary;
    },
    {
      internalCount: 0,
      publishedCount: 0,
    },
  );
}

export function getPostDisplayDate(post: Pick<PostStatusLike, "publishedAt" | "createdAt">) {
  return post.publishedAt ?? post.createdAt ?? null;
}
