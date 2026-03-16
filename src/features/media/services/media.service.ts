import type { StorageProvider } from "@/features/media/types/storage.types";
import { LocalStorageProvider } from "@/features/media/providers/local-storage.provider";
import { VercelBlobStorageProvider } from "@/features/media/providers/vercel-blob.provider";
import * as mediaRepo from "@/features/media/repositories/media.repository";

let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageProvider) {
    const providerType = process.env.STORAGE_PROVIDER ?? "local";
    switch (providerType) {
      case "local":
        storageProvider = new LocalStorageProvider();
        break;
      case "vercel-blob":
        storageProvider = new VercelBlobStorageProvider();
        break;
      default:
        throw new Error(`Unknown storage provider: ${providerType}`);
    }
  }
  return storageProvider;
}

export async function uploadFile(file: File) {
  const provider = getStorageProvider();
  const result = await provider.upload({ file });

  if (result.error) {
    return { ...result, media: undefined };
  }

  const media = await mediaRepo.createMedia({
    url: result.url,
    filename: result.filename,
    mimeType: result.mimeType,
    size: result.size,
    width: null,
    height: null,
    alt: null,
  });

  return { ...result, media };
}

export async function deleteFile(id: string) {
  const media = await mediaRepo.findMediaById(id);
  if (!media) throw new Error("Media not found");

  const provider = getStorageProvider();
  if (provider.delete) {
    await provider.delete(media.url);
  }

  await mediaRepo.deleteMedia(id);
}
