import type { ContentTreeFolder } from "./content-space-tree";

export type ContentSpaceFolderRow = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

export function buildContentSpaceFolderView(
  tree: ContentTreeFolder[],
): ContentSpaceFolderRow[] {
  return tree.map((folder) => {
    return {
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      postCount: folder.postCount,
    };
  });
}

export function getFolderById(
  tree: ContentTreeFolder[],
  folderId?: string,
) {
  if (!folderId) return undefined;
  return tree.find((folder) => folder.id === folderId);
}
