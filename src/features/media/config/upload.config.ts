export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/zip": "zip",
};

export const DEFAULT_MEDIA_ACCEPT = "image/*,.pdf,.zip";
export const LOCAL_UPLOAD_MAX_SIZE = 10 * 1024 * 1024;
export const VERCEL_BLOB_UPLOAD_MAX_SIZE = 4 * 1024 * 1024;

export function getUploadExtension(mimeType: string) {
  return ALLOWED_UPLOAD_TYPES[mimeType];
}

export function formatUploadLimit(bytes: number) {
  const value = bytes / (1024 * 1024);
  return Number.isInteger(value) ? `${value}MB` : `${value.toFixed(1)}MB`;
}

export function validateUpload(file: File, maxSize: number) {
  if (!getUploadExtension(file.type)) {
    return "File type not allowed";
  }

  if (file.size > maxSize) {
    return `File too large (max ${formatUploadLimit(maxSize)})`;
  }

  return null;
}
