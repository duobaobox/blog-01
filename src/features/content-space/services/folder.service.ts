import * as folderRepo from "@/features/content-space/repositories/folder.repository";
import { assertFolderCanBeDeleted } from "@/features/content-space/lib/folder-deletion";
import type { FolderWriteInput } from "@/features/content-space/lib/folder-write";
import { requireEntity } from "@/shared/lib/validation";
import { generateSemanticSlug } from "@/shared/lib/slug";

export async function createFolder(input: FolderWriteInput) {
  const folders = await folderRepo.findFolders();
  const slug = await generateSemanticSlug(
    async (value) => Boolean(await folderRepo.findFolderBySlug(value)),
    { title: input.name, prefix: "f" },
  );

  return folderRepo.createFolder({
    name: input.name,
    slug,
    description: input.description,
    sortOrder: folders.length,
  });
}

export async function renameFolder(id: string, input: FolderWriteInput) {
  requireEntity(
    await folderRepo.findFolderById(id),
    "文件夹不存在",
  );

  return folderRepo.updateFolder(id, {
    name: input.name,
    description: input.description,
  });
}

export async function deleteFolder(id: string) {
  const folder = requireEntity(
    await folderRepo.findFolderByIdWithPostCount(id),
    "文件夹不存在",
  );

  assertFolderCanBeDeleted(folder._count.posts);
  await folderRepo.deleteFolder(id);
}
