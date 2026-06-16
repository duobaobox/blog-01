export type ContentTreePost = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date | string;
  folderId: string | null;
};

export type ContentTreeFolderInput = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  postCount: number;
};

export type ContentTreeInput = {
  folders: ContentTreeFolderInput[];
  posts: ContentTreePost[];
};

export type ContentTreeFolder = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  posts: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date | string;
    folderId: string | null;
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

export function buildContentTree(input: ContentTreeInput): ContentTreeFolder[] {
  const postsByFolderId = new Map<string, ContentTreePost[]>();

  for (const post of input.posts) {
    if (!post.folderId) {
      continue;
    }

    const current = postsByFolderId.get(post.folderId) ?? [];
    current.push(post);
    postsByFolderId.set(post.folderId, current);
  }

  return [...input.folders]
    .sort(compareBySortOrderThenName)
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      postCount: folder.postCount,
      posts: [...(postsByFolderId.get(folder.id) ?? [])].sort(
        comparePostsByUpdatedAtDesc,
      ),
    }));
}
