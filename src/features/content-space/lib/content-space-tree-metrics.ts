import type { ContentTreeTopic } from "./content-space-tree";

type TreeMetric = {
  totalPosts: number;
  draftPosts: number;
  publishedPosts: number;
  lastUpdatedAt: string | null;
};

export function buildContentTreeMetrics(tree: ContentTreeTopic[]) {
  const topicById = new Map<string, TreeMetric>();
  const subtopicById = new Map<string, TreeMetric>();

  for (const topic of tree) {
    let topicTotal = 0;
    let topicDrafts = 0;
    let topicPublished = 0;
    let topicLastUpdatedAt: string | null = null;

    for (const subtopic of topic.subtopics) {
      const totalPosts = subtopic.posts.length;
      const draftPosts = subtopic.posts.filter(
        (post) => post.status !== "published",
      ).length;
      const publishedPosts = totalPosts - draftPosts;
      const lastUpdatedAt = subtopic.posts.reduce<string | null>(
        (latest, post) => {
          const value =
            post.updatedAt instanceof Date
              ? post.updatedAt.toISOString()
              : post.updatedAt;

          if (!latest) return value;
          return new Date(value).getTime() > new Date(latest).getTime()
            ? value
            : latest;
        },
        null,
      );

      subtopicById.set(subtopic.id, {
        totalPosts,
        draftPosts,
        publishedPosts,
        lastUpdatedAt,
      });

      topicTotal += totalPosts;
      topicDrafts += draftPosts;
      topicPublished += publishedPosts;

      if (
        lastUpdatedAt &&
        (!topicLastUpdatedAt ||
          new Date(lastUpdatedAt).getTime() >
            new Date(topicLastUpdatedAt).getTime())
      ) {
        topicLastUpdatedAt = lastUpdatedAt;
      }
    }

    topicById.set(topic.id, {
      totalPosts: topicTotal,
      draftPosts: topicDrafts,
      publishedPosts: topicPublished,
      lastUpdatedAt: topicLastUpdatedAt,
    });
  }

  return {
    topicById,
    subtopicById,
  };
}
