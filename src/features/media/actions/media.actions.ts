"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as mediaService from "@/features/media/services/media.service";
import * as mediaRepo from "@/features/media/repositories/media.repository";

export async function uploadMedia(formData: FormData) {
  await requireAdminSession();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  const result = await mediaService.uploadFile(file);

  if (result.error) {
    throw new Error(result.error);
  }

  revalidatePath("/admin/media");
  return result.media;
}

export async function deleteMedia(id: string) {
  await requireAdminSession();
  await mediaService.deleteFile(id);
  revalidatePath("/admin/media");
}

export async function updateMediaAlt(id: string, alt: string) {
  await requireAdminSession();
  await mediaRepo.updateMediaAlt(id, alt || null);
  revalidatePath("/admin/media");
}
