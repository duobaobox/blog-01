import * as mediaRepo from "@/features/media/repositories/media.repository";

export async function getMediaList(options?: mediaRepo.FindMediaOptions) {
  return mediaRepo.findMedia(options);
}

export async function getMediaById(id: string) {
  return mediaRepo.findMediaById(id);
}

export async function getMediaCount(mimeTypePrefix?: string) {
  return mediaRepo.countMedia(mimeTypePrefix);
}
