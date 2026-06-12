import type { ContentTreeTopic } from "./content-space-tree";

export type WorkspacePostSummary = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
  subtopic: {
    id: string;
    name: string;
    slug: string;
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
};

export type ContentSpaceEntry =
  | "recent"
  | "drafts"
  | "ready"
  | "topic"
  | "subtopic"
  | "search";

export type ContentSpaceParams = {
  entry?: string;
  topic?: string;
  subtopic?: string;
  postId?: string;
  view?: string;
  q?: string;
};

export type ResolvedContentSpaceState = {
  mode: "new" | "edit";
  entry: ContentSpaceEntry;
  searchQuery: string;
  activeTopic?: {
    id: string;
    name: string;
    slug: string;
  };
  activeSubtopic?: {
    id: string;
    name: string;
    slug: string;
  };
  selectedPostId?: string;
  contextPosts: WorkspacePostSummary[];
};

type ResolveContentSpaceStateOptions = {
  params: ContentSpaceParams;
  contentTree: ContentTreeTopic[];
  recentEdited: WorkspacePostSummary[];
  draftPosts: WorkspacePostSummary[];
  readyToPublishPosts: WorkspacePostSummary[];
  searchResults: WorkspacePostSummary[];
  requestedPost?: WorkspacePostSummary | null;
};

type BuildContentSpaceUrlInput = {
  current: {
    entry: ContentSpaceEntry;
    topicId?: string;
    subtopicId?: string;
    postId?: string;
    view: "new" | "edit";
    q?: string;
  };
  next: Partial<{
    entry: ContentSpaceEntry;
    topicId?: string;
    subtopicId?: string;
    postId?: string;
    view: "new" | "edit";
    q?: string;
  }>;
};

type TopicNode = ContentTreeTopic;
type SubtopicNode = ContentTreeTopic["subtopics"][number];

function normalizeEntry(value: string | undefined): ContentSpaceEntry | undefined {
  if (
    value === "recent" ||
    value === "drafts" ||
    value === "ready" ||
    value === "topic" ||
    value === "subtopic" ||
    value === "search"
  ) {
    return value;
  }

  return undefined;
}

function findTopic(contentTree: ContentTreeTopic[], topicId?: string) {
  if (!topicId) return undefined;
  return contentTree.find((topic) => topic.id === topicId);
}

function findSubtopic(
  contentTree: ContentTreeTopic[],
  subtopicId?: string,
): { topic: TopicNode; subtopic: SubtopicNode } | undefined {
  if (!subtopicId) return undefined;

  for (const topic of contentTree) {
    const subtopic = topic.subtopics.find((item) => item.id === subtopicId);
    if (subtopic) {
      return { topic, subtopic };
    }
  }

  return undefined;
}

function findPostInTree(contentTree: ContentTreeTopic[], postId?: string) {
  if (!postId) return undefined;

  for (const topic of contentTree) {
    for (const subtopic of topic.subtopics) {
      const post = subtopic.posts.find((item) => item.id === postId);
      if (post) {
        return { topic, subtopic, post };
      }
    }
  }

  return undefined;
}

function summarizeTreePosts(
  subtopic: SubtopicNode,
  topic: TopicNode,
): WorkspacePostSummary[] {
  return subtopic.posts.map((post) => ({
    id: post.id,
    title: post.title,
    status: post.status,
    updatedAt: post.updatedAt,
    subtopic: {
      id: subtopic.id,
      name: subtopic.name,
      slug: subtopic.slug,
      topic: {
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
      },
    },
  }));
}

function summarizeTopicPosts(topic: TopicNode): WorkspacePostSummary[] {
  return topic.subtopics.flatMap((subtopic) => summarizeTreePosts(subtopic, topic));
}

function dedupePosts(posts: WorkspacePostSummary[]) {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }

    seen.add(post.id);
    return true;
  });
}

function selectPostId(
  contextPosts: WorkspacePostSummary[],
  requestedPostId: string | undefined,
  mode: "new" | "edit",
) {
  if (mode === "new") {
    return undefined;
  }

  if (requestedPostId && contextPosts.some((post) => post.id === requestedPostId)) {
    return requestedPostId;
  }

  return contextPosts[0]?.id;
}

export function resolveContentSpaceState({
  params,
  contentTree,
  recentEdited,
  draftPosts,
  readyToPublishPosts,
  searchResults,
  requestedPost,
}: ResolveContentSpaceStateOptions): ResolvedContentSpaceState {
  const searchQuery = params.q?.trim() ?? "";
  const mode = params.view === "new" ? "new" : "edit";
  const requestedEntry = normalizeEntry(params.entry);

  if (searchQuery) {
    return {
      mode,
      entry: "search",
      searchQuery,
      selectedPostId: selectPostId(searchResults, params.postId, mode),
      contextPosts: dedupePosts(searchResults),
    };
  }

  if (requestedEntry === "drafts" || requestedEntry === "ready") {
    const contextPosts =
      requestedEntry === "drafts" ? draftPosts : readyToPublishPosts;

    return {
      mode,
      entry: requestedEntry,
      searchQuery,
      selectedPostId: selectPostId(contextPosts, params.postId, mode),
      contextPosts: dedupePosts(contextPosts),
    };
  }

  const postContext =
    requestedPost?.subtopic
      ? {
          topic: {
            id: requestedPost.subtopic.topic.id,
            name: requestedPost.subtopic.topic.name,
            slug: requestedPost.subtopic.topic.slug,
            subtopics: [],
          },
          subtopic: {
            id: requestedPost.subtopic.id,
            name: requestedPost.subtopic.name,
            slug: requestedPost.subtopic.slug,
            posts: [],
          },
        }
      : findPostInTree(contentTree, params.postId);

  const explicitSubtopic = findSubtopic(contentTree, params.subtopic);
  if (explicitSubtopic) {
    const contextPosts = dedupePosts(
      summarizeTreePosts(explicitSubtopic.subtopic, explicitSubtopic.topic),
    );

    return {
      mode,
      entry: "subtopic",
      searchQuery,
      activeTopic: {
        id: explicitSubtopic.topic.id,
        name: explicitSubtopic.topic.name,
        slug: explicitSubtopic.topic.slug,
      },
      activeSubtopic: {
        id: explicitSubtopic.subtopic.id,
        name: explicitSubtopic.subtopic.name,
        slug: explicitSubtopic.subtopic.slug,
      },
      selectedPostId: selectPostId(contextPosts, params.postId, mode),
      contextPosts,
    };
  }

  const explicitTopic = findTopic(contentTree, params.topic);
  if (explicitTopic) {
    const contextPosts = dedupePosts(summarizeTopicPosts(explicitTopic));

    return {
      mode,
      entry: "topic",
      searchQuery,
      activeTopic: {
        id: explicitTopic.id,
        name: explicitTopic.name,
        slug: explicitTopic.slug,
      },
      selectedPostId: selectPostId(contextPosts, params.postId, mode),
      contextPosts,
    };
  }

  if (postContext) {
    const contextPosts = dedupePosts(
      requestedPost?.subtopic
        ? recentEdited.filter(
            (post) => post.subtopic?.id === requestedPost.subtopic?.id,
          )
        : summarizeTreePosts(postContext.subtopic, postContext.topic),
    );

    return {
      mode,
      entry: "subtopic",
      searchQuery,
      activeTopic: {
        id: postContext.topic.id,
        name: postContext.topic.name,
        slug: postContext.topic.slug,
      },
      activeSubtopic: {
        id: postContext.subtopic.id,
        name: postContext.subtopic.name,
        slug: postContext.subtopic.slug,
      },
      selectedPostId: selectPostId(
        contextPosts.length > 0 ? contextPosts : recentEdited,
        params.postId ?? requestedPost?.id,
        mode,
      ),
      contextPosts:
        contextPosts.length > 0
          ? contextPosts
          : requestedPost
            ? [requestedPost]
            : [],
    };
  }

  const entry: Extract<ContentSpaceEntry, "recent" | "topic" | "subtopic" | "search"> =
    requestedEntry ?? "recent";
  const contextPosts = recentEdited;

  return {
    mode,
    entry,
    searchQuery,
    selectedPostId: selectPostId(contextPosts, params.postId, mode),
    contextPosts: dedupePosts(contextPosts),
  };
}

export function buildContentSpaceUrl(
  pathname: string,
  input: BuildContentSpaceUrlInput,
) {
  const nextState = {
    entry: input.next.entry ?? input.current.entry,
    topicId:
      Object.prototype.hasOwnProperty.call(input.next, "topicId")
        ? input.next.topicId
        : input.current.topicId,
    subtopicId:
      Object.prototype.hasOwnProperty.call(input.next, "subtopicId")
        ? input.next.subtopicId
        : input.current.subtopicId,
    postId:
      Object.prototype.hasOwnProperty.call(input.next, "postId")
        ? input.next.postId
        : input.current.postId,
    view: input.next.view ?? input.current.view,
    q:
      Object.prototype.hasOwnProperty.call(input.next, "q")
        ? input.next.q
        : input.current.q,
  };

  const params = new URLSearchParams();
  const query = nextState.q?.trim() ?? "";

  if (query) {
    params.set("q", query);
  }

  if (nextState.entry === "drafts") {
    params.set("entry", "drafts");
  }

  if (nextState.entry === "ready") {
    params.set("entry", "ready");
  }

  if (nextState.entry === "topic" && nextState.topicId) {
    params.set("topic", nextState.topicId);
  }

  if (nextState.entry === "subtopic" && nextState.subtopicId) {
    params.set("subtopic", nextState.subtopicId);
  }

  if (nextState.view === "new") {
    params.set("view", "new");
  } else if (nextState.postId) {
    params.set("postId", nextState.postId);
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
