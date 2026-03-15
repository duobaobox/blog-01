export interface UploadOptions {
  file: File;
  folder?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  error?: string;
}

export interface StorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete?(url: string): Promise<void>;
}

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: Date | string;
};
