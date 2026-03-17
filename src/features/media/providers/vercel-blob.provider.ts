import { del, put } from "@vercel/blob";
import type {
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
  async upload({ file }: UploadOptions): Promise<UploadResult> {
    const validationError = validateUpload(file, VERCEL_BLOB_UPLOAD_MAX_SIZE);
    if (validationError) {
      return {
        url: "",
        filename: "",
        size: 0,
        mimeType: "",
        error: validationError,
      };
    }

    const ext = getUploadExtension(file.type);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const pathname = `media/${filename}`;

    const blob = await put(pathname, file, {
      access: "public",
      token: getBlobToken(),
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      filename,
      size: file.size,
      mimeType: file.type,
    };
  }

  async delete(url: string): Promise<void> {
    await del(url, { token: getBlobToken() });
  }
}
