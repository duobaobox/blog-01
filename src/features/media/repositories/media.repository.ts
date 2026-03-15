import { db } from "@/infrastructure/db";

export type FindMediaOptions = {
  mimeTypePrefix?: string;
  take?: number;
  skip?: number;
};

export async function findMedia(options?: FindMediaOptions) {
  const where: Record<string, unknown> = {};

  if (options?.mimeTypePrefix) {
    where.mimeType = { startsWith: options.mimeTypePrefix };
  }

  return db.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
  });
}

export async function findMediaById(id: string) {
  return db.media.findUnique({ where: { id } });
}

export async function countMedia(mimeTypePrefix?: string) {
  return db.media.count({
    where: mimeTypePrefix
      ? { mimeType: { startsWith: mimeTypePrefix } }
      : undefined,
  });
}

export async function createMedia(data: {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
}) {
  return db.media.create({ data });
}

export async function updateMediaAlt(id: string, alt: string | null) {
  return db.media.update({ where: { id }, data: { alt } });
}

export async function deleteMedia(id: string) {
  return db.media.delete({ where: { id } });
}
