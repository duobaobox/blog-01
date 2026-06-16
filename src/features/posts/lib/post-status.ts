export type PostStatusLike = {
  status?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type PostStatusSummary = {
  draftCount: number;
  reviewCount: number;
  publishedCount: number;
  archivedCount: number;
};

export function isDraftPost(post: Pick<PostStatusLike, "status">) {
  return post.status === "draft";
}

export function isReviewPost(post: Pick<PostStatusLike, "status">) {
  return post.status === "review";
}

export function isPublishedPost(post: Pick<PostStatusLike, "status">) {
  return post.status === "published";
}

export function isArchivedPost(post: Pick<PostStatusLike, "status">) {
  return post.status === "archived";
}

export function getPostStatusLabel(post: Pick<PostStatusLike, "status">) {
  if (isPublishedPost(post)) {
    return "已发布";
  }

  if (isArchivedPost(post)) {
    return "已归档";
  }

  if (isReviewPost(post)) {
    return "待发布";
  }

  return "草稿";
}

export function getPostStatusTone(post: Pick<PostStatusLike, "status">) {
  if (isPublishedPost(post)) {
    return "published" as const;
  }

  if (isArchivedPost(post)) {
    return "archived" as const;
  }

  if (isReviewPost(post)) {
    return "review" as const;
  }

  return "draft" as const;
}

export function summarizePostStatuses(
  posts: Array<Pick<PostStatusLike, "status">>,
): PostStatusSummary {
  return posts.reduce<PostStatusSummary>(
    (summary, post) => {
      if (isPublishedPost(post)) {
        summary.publishedCount += 1;
      } else if (isArchivedPost(post)) {
        summary.archivedCount += 1;
      } else if (isReviewPost(post)) {
        summary.reviewCount += 1;
      } else {
        summary.draftCount += 1;
      }

      return summary;
    },
    {
      draftCount: 0,
      reviewCount: 0,
      publishedCount: 0,
      archivedCount: 0,
    },
  );
}

export function getPostDisplayDate(post: Pick<PostStatusLike, "publishedAt" | "createdAt">) {
  return post.publishedAt ?? post.createdAt ?? null;
}
