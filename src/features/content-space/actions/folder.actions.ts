"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminPosts } from "@/infrastructure/cache/admin-cache";
import { revalidatePostsContent } from "@/infrastructure/cache/content-cache";
import { createFolderActionRunner } from "@/features/content-space/actions/folder-action-runner";
import { parseFolderWriteFormData } from "@/features/content-space/lib/folder-write";
import * as folderService from "@/features/content-space/services/folder.service";

const folderActionRunner = createFolderActionRunner({
  folderService,
  revalidateAdminPosts,
  revalidatePostsContent,
});

export async function createFolder(formData: FormData) {
  await requireAdminSession();
  const input = parseFolderWriteFormData(formData);
  return folderActionRunner.createFolder(input);
}

export async function renameFolder(id: string, formData: FormData) {
  await requireAdminSession();
  const input = parseFolderWriteFormData(formData);
  await folderActionRunner.renameFolder(id, input);
}

export async function deleteFolder(id: string) {
  await requireAdminSession();
  await folderActionRunner.deleteFolder(id);
}
