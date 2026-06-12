import { db } from "@/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";

export type PostFilters = {
  status?: string;
  categoryId?: string;
  subtopicId?: string;
  tagId?: string;
  isFeatured?: boolean;
  query?: string;
};

export type FindPostsOptions = {
  status?: string;
  categoryId?: string;
  subtopicId?: string;
  tagId?: string;
  take?: number;
  skip?: number;
  isFeatured?: boolean;
  query?: string;
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
  subtopic: {
    select: {
      id: true,
      name: true,
      slug: true,
      topic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
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
  subtopic: {
    select: {
      id: true,
      name: true,
      slug: true,
      topic: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.postSelect;

function buildPostWhere(filters?: PostFilters): Prisma.postWhereInput {
  const where: Prisma.postWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.subtopicId) {
    where.subtopicId = filters.subtopicId;
  }

  if (filters?.tagId) {
    where.tags = { some: { tagId: filters.tagId } };
  }

  if (typeof filters?.isFeatured === "boolean") {
    where.isFeatured = filters.isFeatured;
  }

  const query = filters?.query?.trim();
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
      { contentText: { contains: query, mode: "insensitive" } },
      {
        category: {
          is: {
            name: { contains: query, mode: "insensitive" },
          },
        },
      },
      {
        tags: {
          some: {
            tag: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  return where;
}

export async function findPosts(options?: FindPostsOptions) {
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

  return db.post.findMany({
    where: buildPostWhere(options),
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

export async function countPosts(filters?: string | PostFilters) {
  const where =
    typeof filters === "string"
      ? buildPostWhere({ status: filters })
      : buildPostWhere(filters);

  return db.post.count({
    where: Object.keys(where).length > 0 ? where : undefined,
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

export async function findPostsBySubtopic(
  subtopicId: string,
  options?: Omit<FindPostsOptions, "subtopicId">,
) {
  return findPosts({
    ...options,
    subtopicId,
  });
}

export async function findRecentlyUpdatedPosts(take = 12) {
  return db.post.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: postListSelect,
  });
}

export async function findDraftPosts(take = 20) {
  return db.post.findMany({
    where: { status: "draft" },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: postListSelect,
  });
}

export async function findReadyToPublishPosts(take = 20) {
  return db.post.findMany({
    where: {
      status: "draft",
      title: {
        not: "",
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: postListSelect,
  });
}
