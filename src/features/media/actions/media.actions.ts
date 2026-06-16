"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminMedia } from "@/infrastructure/cache/admin-cache";
import { mediaActionRunner } from "@/features/media/actions/media-action-runtime";
import { parseMediaFileFormData } from "@/features/media/lib/media-write";

export async function uploadMedia(formData: FormData) {
  await requireAdminSession();
  return mediaActionRunner.uploadMedia(parseMediaFileFormData(formData));
}

export async function deleteMedia(id: string) {
  await requireAdminSession();
  await mediaActionRunner.deleteMedia(id);
}

export async function updateMediaAlt(id: string, alt: string) {
  await requireAdminSession();
  await mediaActionRunner.updateMediaAlt(id, alt);
  revalidateAdminMedia();
}
