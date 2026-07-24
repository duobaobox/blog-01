import type { StorageProvider } from "@/features/media/types/storage.types";
import { LocalStorageProvider } from "@/features/media/providers/local-storage.provider";
import { VercelBlobStorageProvider } from "@/features/media/providers/vercel-blob.provider";
import { extractMediaDimensions } from "@/features/media/lib/media-metadata";
import { resolveMediaStorageRecord } from "@/features/media/lib/media-storage";
import { assertCompatibleMediaReplacement } from "@/features/media/lib/media-replacement";
import * as mediaRepo from "@/features/media/repositories/media.repository";
import {
  AppError,
  ConflictError,
  ConfigurationError,
  NotFoundError,
  ValidationError,
} from "@/shared/lib/app-error";

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
      throw new ConfigurationError(`Unknown storage provider: ${providerType}`);
  }

  storageProviders.set(providerType, provider);
  return provider;
}

export async function uploadFile(file: File) {
  const provider = getStorageProvider();
  const result = await provider.upload({ file });

  if (result.error) {
    throw new ValidationError(result.error);
  }

  const dimensions = await extractMediaDimensions(file);

  const media = await mediaRepo.createMedia({
    url: result.url,
    storageProvider: provider.type,
    storageKey: result.storageKey,
    filename: result.filename,
    mimeType: result.mimeType,
    size: result.size,
    width: dimensions.width,
    height: dimensions.height,
    alt: null,
  });

  return media;
}

export async function deleteFile(id: string) {
  const media = await mediaRepo.findMediaById(id);
  if (!media) throw new NotFoundError("Media not found");

  const referenceCount = await mediaRepo.countPostMediaReferences(id);
  if (referenceCount > 0) {
    throw new ConflictError("该媒体仍被文章引用，暂时不能删除");
  }

  const storage = resolveMediaStorageRecord(media);
  const provider = getStorageProvider(storage.provider);
  if (provider.delete) {
    await provider.delete({ key: storage.key, url: storage.url });
  }

  await mediaRepo.deleteMedia(id);
}

export async function replaceFile(id: string, file: File) {
  const media = await mediaRepo.findMediaById(id);
  if (!media) throw new NotFoundError("Media not found");

  assertCompatibleMediaReplacement(media.mimeType, file.type);

  const storage = resolveMediaStorageRecord(media);
  const provider = getStorageProvider(storage.provider);

  if (!provider.replace) {
    throw new AppError(
      "Current storage provider does not support replacing files",
      "UNSUPPORTED_MEDIA_REPLACE",
    );
  }

  const result = await provider.replace({
    file,
    key: storage.key,
    url: storage.url,
    filename: media.filename,
  });

  if (result.error) {
    throw new ValidationError(result.error);
  }

  const dimensions = await extractMediaDimensions(file);

  const updatedMedia = await mediaRepo.updateMediaFile(id, {
    url: result.url,
    storageProvider: provider.type,
    storageKey: result.storageKey,
    filename: result.filename,
    mimeType: result.mimeType,
    size: result.size,
    width: dimensions.width,
    height: dimensions.height,
  });

  return updatedMedia;
}

export async function updateMediaAlt(id: string, alt: string) {
  const media = await mediaRepo.findMediaById(id);
  if (!media) {
    throw new NotFoundError("Media not found");
  }

  const normalizedAlt = alt.trim();

  if (normalizedAlt.length > 500) {
    throw new ValidationError("媒体描述不能超过 500 个字符");
  }

  return mediaRepo.updateMediaAlt(id, normalizedAlt || null);
}
