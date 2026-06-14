import { db } from "@/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";

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
  storageProvider: string;
  storageKey: string | null;
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

export async function updateMediaFile(
  id: string,
  data: {
    url: string;
    storageProvider: string;
    storageKey: string | null;
    filename: string;
    mimeType: string;
    size: number;
  },
) {
  return db.media.update({
    where: { id },
    data,
  });
}

export async function deleteMedia(id: string) {
  return db.media.delete({ where: { id } });
}

export type MediaReference = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
  usage: Array<"cover" | "content">;
};

export async function findMediaReferences(url: string): Promise<MediaReference[]> {
  const posts = await db.post.findMany({
    where: {
      OR: [
        { coverImageUrl: url },
        { contentHtml: { contains: url } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      coverImageUrl: true,
      contentHtml: true,
      folder: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return posts.map((post) => {
    const usage: MediaReference["usage"] = [];

    if (post.coverImageUrl === url) {
      usage.push("cover");
    }

    if (post.contentHtml.includes(url)) {
      usage.push("content");
    }

    return {
      id: post.id,
      title: post.title,
      status: post.status,
      updatedAt: post.updatedAt,
      folder: post.folder,
      usage,
    };
  });
}
