import path from "path";
import fs from "fs/promises";
import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
} from "@/features/media/types/storage.types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/zip": "zip",
};
const MAX_SIZE = 10 * 1024 * 1024; // 最大 10 兆字节

export class LocalStorageProvider implements StorageProvider {
  async upload({ file }: UploadOptions): Promise<UploadResult> {
    const ext = ALLOWED_TYPES[file.type];

    if (!ext) {
      return {
        url: "",
        filename: "",
        size: 0,
        mimeType: "",
        error: "File type not allowed",
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        url: "",
        filename: "",
        size: 0,
        mimeType: "",
        error: "File too large (max 10MB)",
      };
    }

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
