import type {
  StorageProviderType,
} from "@/features/media/types/storage.types";

const LOCAL_MEDIA_PREFIX = "/media/";

export function extractLocalStorageKey(url: string) {
  if (!url.startsWith(LOCAL_MEDIA_PREFIX)) {
    return null;
  }

  const key = url.slice(LOCAL_MEDIA_PREFIX.length);
  return key || null;
}

export function normalizeStorageProvider(
  provider: string | null | undefined,
): StorageProviderType {
  return provider === "vercel-blob" ? "vercel-blob" : "local";
}

export function resolveMediaStorageRecord(media: {
  url: string;
  storageProvider?: string | null;
  storageKey?: string | null;
}) {
  const provider = normalizeStorageProvider(media.storageProvider);

  return {
    provider,
    key:
      media.storageKey ??
      (provider === "local" ? extractLocalStorageKey(media.url) : null),
    url: media.url,
  };
}
