import type { StorageProvider } from "@/features/media/types/storage.types";
import { LocalStorageProvider } from "@/features/media/providers/local-storage.provider";
import { VercelBlobStorageProvider } from "@/features/media/providers/vercel-blob.provider";
import { resolveMediaStorageRecord } from "@/features/media/lib/media-storage";
import * as mediaRepo from "@/features/media/repositories/media.repository";

const storageProviders = new Map<string, StorageProvider>();

export function getConfiguredStorageProviderType() {
  return process.env.STORAGE_PROVIDER?.trim() || "local";
}

export function getStorageProvider(providerType = getConfiguredStorageProviderType()): StorageProvider {
  const existingProvider = storageProviders.get(providerType);
  if (existingProvider) {
    return existingProvider;
  }

  let provider: StorageProvider;

  switch (providerType) {
    case "local":
      provider = new LocalStorageProvider();
      break;
    case "vercel-blob":
      provider = new VercelBlobStorageProvider();
      break;
    default:
      throw new Error(`Unknown storage provider: ${providerType}`);
  }

  storageProviders.set(providerType, provider);
  return provider;
}

export async function uploadFile(file: File) {
  const provider = getStorageProvider();
  const result = await provider.upload({ file });

  if (result.error) {
    return { ...result, media: undefined };
  }

  const media = await mediaRepo.createMedia({
    url: result.url,
    storageProvider: provider.type,
    storageKey: result.storageKey,
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

  const storage = resolveMediaStorageRecord(media);
  const provider = getStorageProvider(storage.provider);
  if (provider.delete) {
    await provider.delete({ key: storage.key, url: storage.url });
  }

  await mediaRepo.deleteMedia(id);
}

export async function replaceFile(id: string, file: File) {
  const media = await mediaRepo.findMediaById(id);
  if (!media) throw new Error("Media not found");

  const storage = resolveMediaStorageRecord(media);
  const provider = getStorageProvider(storage.provider);

  if (!provider.replace) {
    throw new Error("Current storage provider does not support replacing files");
  }

  const result = await provider.replace({
    file,
    key: storage.key,
    url: storage.url,
    filename: media.filename,
  });

  if (result.error) {
    return { ...result, media: undefined };
  }

  const updatedMedia = await mediaRepo.updateMediaFile(id, {
    url: result.url,
    storageProvider: provider.type,
    storageKey: result.storageKey,
    filename: result.filename,
    mimeType: result.mimeType,
    size: result.size,
  });

  return {
    ...result,
    media: updatedMedia,
  };
}
