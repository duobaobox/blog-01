export type StorageProviderType = "local" | "vercel-blob";

export interface UploadOptions {
  file: File;
  folder?: string;
  storageKey?: string;
  filename?: string;
}

export interface UploadResult {
  url: string;
  storageKey: string;
  filename: string;
  size: number;
  mimeType: string;
  error?: string;
}

export interface DeleteOptions {
  url: string;
  key?: string | null;
}

export interface ReplaceOptions {
  file: File;
  url: string;
  key?: string | null;
  filename?: string;
}

export interface StorageProvider {
  readonly type: StorageProviderType;
  upload(options: UploadOptions): Promise<UploadResult>;
  delete?(options: DeleteOptions): Promise<void>;
  replace?(options: ReplaceOptions): Promise<UploadResult>;
}

export type MediaItem = {
  id: string;
  url: string;
  storageProvider?: StorageProviderType;
  storageKey?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: Date | string;
};
