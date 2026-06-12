export type ContentTreePost = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
  subtopicId: string | null;
};

export type ContentTreeSubtopicInput = {
  id: string;
  topicId: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type ContentTreeTopicInput = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type ContentTreeInput = {
  topics: ContentTreeTopicInput[];
  subtopics: ContentTreeSubtopicInput[];
  posts: ContentTreePost[];
};

export type ContentTreeTopic = {
  id: string;
  name: string;
  slug: string;
  subtopics: Array<{
    id: string;
    name: string;
    slug: string;
    posts: Array<{
      id: string;
      title: string;
      status: string;
      updatedAt: Date | string;
      subtopicId: string | null;
    }>;
  }>;
};

function compareBySortOrderThenName<
  T extends { sortOrder: number; name: string },
>(a: T, b: T) {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }

  return a.name.localeCompare(b.name, "zh-CN");
}

function comparePostsByUpdatedAtDesc(a: ContentTreePost, b: ContentTreePost) {
  return (
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function buildContentTree(input: ContentTreeInput): ContentTreeTopic[] {
  const postsBySubtopicId = new Map<string, ContentTreePost[]>();

  for (const post of input.posts) {
    if (!post.subtopicId) {
      continue;
    }

    const current = postsBySubtopicId.get(post.subtopicId) ?? [];
    current.push(post);
    postsBySubtopicId.set(post.subtopicId, current);
  }

  const subtopicsByTopicId = new Map<string, ContentTreeSubtopicInput[]>();

  for (const subtopic of input.subtopics) {
    const current = subtopicsByTopicId.get(subtopic.topicId) ?? [];
    current.push(subtopic);
    subtopicsByTopicId.set(subtopic.topicId, current);
  }

  return [...input.topics]
    .sort(compareBySortOrderThenName)
    .map((topic) => ({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      subtopics: [...(subtopicsByTopicId.get(topic.id) ?? [])]
        .sort(compareBySortOrderThenName)
        .map((subtopic) => ({
          id: subtopic.id,
          name: subtopic.name,
          slug: subtopic.slug,
          posts: [...(postsBySubtopicId.get(subtopic.id) ?? [])].sort(
            comparePostsByUpdatedAtDesc,
          ),
        })),
    }));
}
