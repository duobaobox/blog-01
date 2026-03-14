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
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export class LocalStorageProvider implements StorageProvider {
  async upload({ file }: UploadOptions): Promise<UploadResult> {
    const ext = ALLOWED_TYPES[file.type];

    if (!ext) {
      return { url: "", error: "File type not allowed" };
    }

    if (file.size > MAX_SIZE) {
      return { url: "", error: "File too large (max 5MB)" };
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    return { url: `/uploads/${filename}` };
  }

  async delete(url: string): Promise<void> {
    const filename = url.replace("/uploads/", "");
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filepath).catch(() => {});
  }
}
