import { db } from "@/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";

const postSaveStateSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  contentJson: true,
  contentHtml: true,
  contentText: true,
  contentToc: true,
  status: true,
  categoryId: true,
  folderId: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  isFeatured: true,
  publishedAt: true,
  updatedAt: true,
  readingTimeMinutes: true,
  wordCount: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  folder: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
  mediaReferences: {
    select: {
      mediaId: true,
      usage: true,
    },
  },
} satisfies Prisma.postSelect;

export function findPostSaveState(id: string) {
  return db.post.findFirst({
    where: { id },
    select: postSaveStateSelect,
  });
}

type MaterializedContentUpdate = {
  contentJson: unknown;
  contentHtml: string;
  contentText: string;
  contentToc: unknown;
  readingTimeMinutes: number;
  wordCount: number;
};

type MediaReferenceInput = {
  mediaId: string;
  usage: "cover" | "content";
};

export async function updatePostIncrementally(
  id: string,
  data: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    categoryId: string | null;
    folderId: string | null;
    status: string;
    publishedAt: Date | null;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    isFeatured: boolean;
    contentUpdate?: MaterializedContentUpdate;
    tagIds: string[];
    syncTags: boolean;
    mediaReferences: MediaReferenceInput[];
    syncMediaReferences: boolean;
  },
) {
  const {
    contentUpdate,
    tagIds,
    syncTags,
    mediaReferences,
    syncMediaReferences,
    ...postData
  } = data;

  return db.$transaction(async (tx) => {
    if (syncTags) {
      await tx.postTag.deleteMany({ where: { postId: id } });
    }

    if (syncMediaReferences) {
      await tx.postMediaReference.deleteMany({ where: { postId: id } });
    }

    const post = await tx.post.update({
      where: { id },
      data: {
        ...postData,
        ...(contentUpdate
          ? {
              contentJson: contentUpdate.contentJson as Prisma.InputJsonValue,
              contentHtml: contentUpdate.contentHtml,
              contentText: contentUpdate.contentText,
              contentToc: contentUpdate.contentToc as Prisma.InputJsonValue,
              readingTimeMinutes: contentUpdate.readingTimeMinutes,
              wordCount: contentUpdate.wordCount,
            }
          : {}),
      },
    });

    if (syncTags && tagIds.length > 0) {
      await tx.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId: id, tagId })),
      });
    }

    if (syncMediaReferences && mediaReferences.length > 0) {
      await tx.postMediaReference.createMany({
        data: mediaReferences.map((reference) => ({
          postId: id,
          mediaId: reference.mediaId,
          usage: reference.usage,
        })),
      });
    }

    return tx.post.findUniqueOrThrow({
      where: { id: post.id },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });
  });
}
