import { db } from "@/infrastructure/db";

export async function findPosts(options?: {
  status?: string;
  categoryId?: string;
  tagId?: string;
  take?: number;
  skip?: number;
}) {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status;
  }
  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }
  if (options?.tagId) {
    where.tags = { some: { tagId: options.tagId } };
  }

  return db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { name: true } },
    },
  });
}

export async function findPostBySlug(slug: string) {
  return db.post.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { name: true } },
    },
  });
}

export async function findPostById(id: string) {
  return db.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });
}

export async function countPosts(status?: string) {
  return db.post.count({
    where: status ? { status } : undefined,
  });
}

export async function createPost(data: {
  title: string;
  slug: string;
  contentMarkdown: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  status: string;
  publishedAt: Date | null;
  readingTimeMinutes: number;
  wordCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  createdBy: string;
  tagIds: string[];
}) {
  const { tagIds, ...postData } = data;

  return db.post.create({
    data: {
      ...postData,
      tags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });
}

export async function updatePost(
  id: string,
  data: {
    title: string;
    slug: string;
    contentMarkdown: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    categoryId: string | null;
    status: string;
    publishedAt: Date | null;
    readingTimeMinutes: number;
    wordCount: number;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    isFeatured: boolean;
    tagIds: string[];
  },
) {
  const { tagIds, ...postData } = data;

  return db.$transaction(async (tx) => {
    await tx.postTag.deleteMany({ where: { postId: id } });

    return tx.post.update({
      where: { id },
      data: {
        ...postData,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });
  });
}

export async function deletePost(id: string) {
  return db.post.delete({ where: { id } });
}

export async function findPublishedForFeed(take = 20) {
  return db.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      contentMarkdown: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function findPublishedSlugs() {
  return db.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });
}
