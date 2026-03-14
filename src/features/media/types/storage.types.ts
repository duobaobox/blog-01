export interface UploadOptions {
  file: File;
  folder?: string;
}

export interface UploadResult {
  url: string;
  error?: string;
}

export interface StorageProvider {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete?(url: string): Promise<void>;
}
