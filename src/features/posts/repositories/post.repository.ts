import { db } from "@/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";

export type FindPostsOptions = {
  status?: string;
  categoryId?: string;
  tagId?: string;
  take?: number;
  skip?: number;
  isFeatured?: boolean;
  order?: "created" | "updated" | "published";
};

const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  contentText: true,
  status: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  readingTimeMinutes: true,
  coverImageUrl: true,
  categoryId: true,
  category: {
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
} satisfies Prisma.postSelect;

const editablePostSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  contentJson: true,
  contentText: true,
  status: true,
  categoryId: true,
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
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.postSelect;

export async function findPosts(options?: FindPostsOptions) {
  const where: Record<string, unknown> = {};
  const orderBy: Prisma.postOrderByWithRelationInput[] =
    options?.order === "published"
      ? [
          { isFeatured: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ]
      : options?.order === "updated"
        ? [{ updatedAt: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  if (options?.status) {
    where.status = options.status;
  }
  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }
  if (options?.tagId) {
    where.tags = { some: { tagId: options.tagId } };
  }
  if (typeof options?.isFeatured === "boolean") {
    where.isFeatured = options.isFeatured;
  }

  return db.post.findMany({
    where,
    orderBy,
    take: options?.take,
    skip: options?.skip,
    select: postListSelect,
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
    select: editablePostSelect,
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
  contentJson: unknown;
  contentHtml: string;
  contentText: string;
  contentToc: unknown;
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
  const { tagIds, contentJson, contentToc, ...postData } = data;

  return db.post.create({
    data: {
      ...postData,
      contentJson: contentJson as Prisma.InputJsonValue,
      contentToc: contentToc as Prisma.InputJsonValue,
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
    contentJson: unknown;
    contentHtml: string;
    contentText: string;
    contentToc: unknown;
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
  const { tagIds, contentJson, contentToc, ...postData } = data;

  return db.$transaction(async (tx) => {
    await tx.postTag.deleteMany({ where: { postId: id } });

    return tx.post.update({
      where: { id },
      data: {
        ...postData,
        contentJson: contentJson as Prisma.InputJsonValue,
        contentToc: contentToc as Prisma.InputJsonValue,
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
      contentText: true,
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
