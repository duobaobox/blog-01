import type { ContentTreeFolder } from "./content-space-tree";

export type WorkspacePostSummary = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type ContentSpaceEntry =
  | "all"
  | "drafts"
  | "ready"
  | "folder"
  | "search";

export type ContentSpaceParams = {
  entry?: string;
  folder?: string;
  postId?: string;
  view?: string;
  q?: string;
};

export type ResolvedContentSpaceState = {
  mode: "new" | "edit";
  entry: ContentSpaceEntry;
  searchQuery: string;
  activeFolder?: {
    id: string;
    name: string;
    slug: string;
  };
  selectedPostId?: string;
  contextPosts: WorkspacePostSummary[];
};

type ResolveContentSpaceStateOptions = {
  params: ContentSpaceParams;
  contentTree: ContentTreeFolder[];
  allPosts: WorkspacePostSummary[];
  draftPosts: WorkspacePostSummary[];
  readyToPublishPosts: WorkspacePostSummary[];
  searchResults: WorkspacePostSummary[];
  requestedPost?: WorkspacePostSummary | null;
};

type BuildContentSpaceUrlInput = {
  current: {
    entry: ContentSpaceEntry;
    folderId?: string;
    postId?: string;
    view: "new" | "edit";
    q?: string;
  };
  next: Partial<{
    entry: ContentSpaceEntry;
    folderId?: string;
    postId?: string;
    view: "new" | "edit";
    q?: string;
  }>;
};

type FolderNode = ContentTreeFolder;

function normalizeEntry(value: string | undefined): ContentSpaceEntry | undefined {
  if (
    value === "all" ||
    value === "drafts" ||
    value === "ready" ||
    value === "folder" ||
    value === "search"
  ) {
    return value;
  }

  return undefined;
}

function findFolder(contentTree: ContentTreeFolder[], folderId?: string) {
  if (!folderId) return undefined;
  return contentTree.find((folder) => folder.id === folderId);
}

function findPostInTree(contentTree: ContentTreeFolder[], postId?: string) {
  if (!postId) return undefined;

  for (const folder of contentTree) {
    const post = folder.posts.find((item) => item.id === postId);
    if (post) {
      return { folder, post };
    }
  }

  return undefined;
}

function summarizeFolderPosts(folder: FolderNode): WorkspacePostSummary[] {
  return folder.posts.map((post) => ({
    id: post.id,
    title: post.title,
    status: post.status,
    updatedAt: post.updatedAt,
    folder: {
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
    },
  }));
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

function resolveSearchContext(
  contentTree: ContentTreeFolder[],
  params: ContentSpaceParams,
) {
  const explicitFolder = findFolder(contentTree, params.folder);
  if (!explicitFolder) return { activeFolder: undefined };

  return {
    activeFolder: {
      id: explicitFolder.id,
      name: explicitFolder.name,
      slug: explicitFolder.slug,
    },
  };
}

export function resolveContentSpaceState({
  params,
  contentTree,
  allPosts,
  draftPosts,
  readyToPublishPosts,
  searchResults,
  requestedPost,
}: ResolveContentSpaceStateOptions): ResolvedContentSpaceState {
  const searchQuery = params.q?.trim() ?? "";
  const mode = params.view === "new" ? "new" : "edit";
  const requestedEntry = normalizeEntry(params.entry);

  if (searchQuery) {
    const searchContext = resolveSearchContext(contentTree, params);

    return {
      mode,
      entry: "search",
      searchQuery,
      activeFolder: searchContext.activeFolder,
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

  const postContext = requestedPost?.folder
    ? {
        folder: {
          id: requestedPost.folder.id,
          name: requestedPost.folder.name,
          slug: requestedPost.folder.slug,
          posts: [],
        },
      }
    : findPostInTree(contentTree, params.postId);

  const explicitFolder = findFolder(contentTree, params.folder);
  if (explicitFolder) {
    const contextPosts = dedupePosts(summarizeFolderPosts(explicitFolder));

    return {
      mode,
      entry: "folder",
      searchQuery,
      activeFolder: {
        id: explicitFolder.id,
        name: explicitFolder.name,
        slug: explicitFolder.slug,
      },
      selectedPostId: selectPostId(contextPosts, params.postId, mode),
      contextPosts,
    };
  }

  if (postContext) {
    const contextPosts = dedupePosts(
      requestedPost?.folder
        ? allPosts.filter((post) => post.folder?.id === requestedPost.folder?.id)
        : summarizeFolderPosts(postContext.folder),
    );

    return {
      mode,
      entry: "folder",
      searchQuery,
      activeFolder: {
        id: postContext.folder.id,
        name: postContext.folder.name,
        slug: postContext.folder.slug,
      },
      selectedPostId: selectPostId(
        contextPosts.length > 0 ? contextPosts : allPosts,
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

  const entry: Extract<ContentSpaceEntry, "all" | "folder" | "search"> =
    requestedEntry === "folder" ? "folder" : "all";
  const contextPosts = allPosts;

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
    folderId:
      Object.prototype.hasOwnProperty.call(input.next, "folderId")
        ? input.next.folderId
        : input.current.folderId,
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
    if (nextState.entry === "folder" && nextState.folderId) {
      params.set("folder", nextState.folderId);
    }

    if (nextState.postId) {
      params.set("postId", nextState.postId);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  if (nextState.entry === "drafts") {
    params.set("entry", "drafts");
  }

  if (nextState.entry === "ready") {
    params.set("entry", "ready");
  }

  if (nextState.entry === "folder" && nextState.folderId) {
    params.set("folder", nextState.folderId);
  }

  if (nextState.view === "new") {
    params.set("view", "new");
  } else if (nextState.postId) {
    params.set("postId", nextState.postId);
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
