import { del, put } from "@vercel/blob";
import type {
  ReplaceOptions,
  StorageProvider,
  UploadOptions,
  UploadResult,
} from "@/features/media/types/storage.types";
import {
  getUploadExtension,
  validateUpload,
  VERCEL_BLOB_UPLOAD_MAX_SIZE,
} from "@/features/media/config/upload.config";

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required for vercel-blob storage",
    );
  }
  return token;
}

export class VercelBlobStorageProvider implements StorageProvider {
  readonly type = "vercel-blob" as const;

  async upload({ file }: UploadOptions): Promise<UploadResult> {
    return this.writeBlob({ file });
  }

  async replace({ file, key, filename }: ReplaceOptions): Promise<UploadResult> {
    return this.writeBlob({
      file,
      storageKey: key ?? undefined,
      filename,
    });
  }

  private async writeBlob({
    file,
    storageKey,
    filename,
  }: UploadOptions): Promise<UploadResult> {
    const validationError = validateUpload(file, VERCEL_BLOB_UPLOAD_MAX_SIZE);
    if (validationError) {
      return {
        url: "",
        storageKey: "",
        filename: "",
        size: 0,
        mimeType: "",
        error: validationError,
      };
    }

    const ext = getUploadExtension(file.type);
    const resolvedFilename =
      filename ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const pathname = storageKey || `media/${resolvedFilename}`;

    const blob = await put(pathname, file, {
      access: "public",
      token: getBlobToken(),
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      storageKey: pathname,
      filename: resolvedFilename,
      size: file.size,
      mimeType: file.type,
    };
  }

  async delete({ url }: { url: string }): Promise<void> {
    await del(url, { token: getBlobToken() });
  }
}
