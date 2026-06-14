import path from "path";
import fs from "fs/promises";
import type {
  ReplaceOptions,
  StorageProvider,
  UploadOptions,
  UploadResult,
} from "@/features/media/types/storage.types";
import {
  getUploadExtension,
  LOCAL_UPLOAD_MAX_SIZE,
  validateUpload,
} from "@/features/media/config/upload.config";

const UPLOAD_DIR = path.join(process.cwd(), "public", "media");

export class LocalStorageProvider implements StorageProvider {
  readonly type = "local" as const;

  async upload({ file }: UploadOptions): Promise<UploadResult> {
    return this.writeFile({ file });
  }

  async replace({ file, key, filename }: ReplaceOptions): Promise<UploadResult> {
    return this.writeFile({
      file,
      storageKey: key ?? undefined,
      filename,
    });
  }

  private async writeFile({
    file,
    storageKey,
    filename,
  }: UploadOptions): Promise<UploadResult> {
    const validationError = validateUpload(file, LOCAL_UPLOAD_MAX_SIZE);
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

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const resolvedFilename =
      storageKey ||
      filename ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, resolvedFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    return {
      url: `/media/${resolvedFilename}`,
      storageKey: resolvedFilename,
      filename: resolvedFilename,
      size: file.size,
      mimeType: file.type,
    };
  }

  async delete({ key, url }: { key?: string | null; url: string }): Promise<void> {
    const filename = key || url.replace("/media/", "");
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filepath).catch(() => {});
  }
}
