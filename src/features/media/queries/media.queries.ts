import { normalizeStorageProvider } from "@/features/media/lib/media-storage";
import * as mediaRepo from "@/features/media/repositories/media.repository";
import type { MediaItem } from "@/features/media/types/storage.types";

function toMediaItem(media: Awaited<ReturnType<typeof mediaRepo.findMediaById>>): MediaItem | null {
  if (!media) {
    return null;
  }

  return {
    ...media,
    storageProvider: normalizeStorageProvider(media.storageProvider),
  };
}

export async function getMediaList(options?: mediaRepo.FindMediaOptions) {
  const items = await mediaRepo.findMedia(options);
  return items.map((item) => ({
    ...item,
    storageProvider: normalizeStorageProvider(item.storageProvider),
  })) satisfies MediaItem[];
}

export async function getMediaById(id: string) {
  const media = await mediaRepo.findMediaById(id);
  return toMediaItem(media);
}

export async function getMediaCount(mimeTypePrefix?: string) {
  return mediaRepo.countMedia(mimeTypePrefix);
}

export async function getMediaReferences(url: string) {
  return mediaRepo.findMediaReferences(url);
}
