import path from "path";
import fs from "fs/promises";
import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
} from "@/features/media/types/storage.types";
import {
  getUploadExtension,
  LOCAL_UPLOAD_MAX_SIZE,
  validateUpload,
} from "@/features/media/config/upload.config";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  async upload({ file }: UploadOptions): Promise<UploadResult> {
    const validationError = validateUpload(file, LOCAL_UPLOAD_MAX_SIZE);
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

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      mimeType: file.type,
    };
  }

  async delete(url: string): Promise<void> {
    const filename = url.replace("/uploads/", "");
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filepath).catch(() => {});
  }
}
