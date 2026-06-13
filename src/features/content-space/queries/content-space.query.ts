import * as folderRepo from "@/features/content-space/repositories/folder.repository";
import * as postRepo from "@/features/posts/repositories/post.repository";
import {
  buildContentTree,
  type ContentTreeInput,
} from "@/features/content-space/lib/content-space-tree";

export async function getContentTree() {
  const [folders, posts] = await Promise.all([
    folderRepo.findFolders(),
    postRepo.findPosts({
      order: "updated",
      take: 200,
    }),
  ]);

  return buildContentTree({
    folders: folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      sortOrder: folder.sortOrder,
    })),
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      updatedAt: post.updatedAt,
      folderId: post.folder?.id ?? null,
    })),
  } satisfies ContentTreeInput);
}

export async function getAllPosts(limit = 200) {
  return postRepo.findRecentlyUpdatedPosts(limit);
}

export async function getDraftPosts(limit = 20) {
  return postRepo.findDraftPosts(limit);
}

export async function getReadyToPublishPosts(limit = 20) {
  return postRepo.findReadyToPublishPosts(limit);
}
