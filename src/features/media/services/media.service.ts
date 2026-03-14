import type { StorageProvider } from "@/features/media/types/storage.types";
import { LocalStorageProvider } from "@/features/media/providers/local-storage.provider";

let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageProvider) {
    storageProvider = new LocalStorageProvider();
  }
  return storageProvider;
}

export async function uploadFile(file: File) {
  const provider = getStorageProvider();
  return provider.upload({ file });
}
