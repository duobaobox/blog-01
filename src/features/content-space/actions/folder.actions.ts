"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as folderRepo from "@/features/content-space/repositories/folder.repository";
import { generateSemanticSlug } from "@/shared/lib/slug";

export async function createFolder(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("文件夹名称不能为空");
  }

  const folders = await folderRepo.findFolders();
  const folderSlug = await generateSemanticSlug(
    async (value) => Boolean(await folderRepo.findFolderBySlug(value)),
    { title: name, prefix: "f" },
  );

  const folder = await folderRepo.createFolder({
    name,
    slug: folderSlug,
    description: null,
    sortOrder: folders.length,
  });

  revalidatePath("/admin/posts");

  return folder;
}

export async function renameFolder(id: string, formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("文件夹名称不能为空");
  }

  await folderRepo.updateFolder(id, {
    name,
    description: null,
  });

  revalidatePath("/admin/posts");
}

export async function deleteFolder(id: string) {
  await requireAdminSession();

  await folderRepo.deleteFolder(id);
  revalidatePath("/admin/posts");
}
