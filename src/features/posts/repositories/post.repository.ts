import { db } from "@/infrastructure/db";
import { Prisma } from "@/generated/prisma/client";
import {
  UNTITLED_POST_TITLE,
  UNTITLED_POST_TITLE_PREFIX,
} from "@/features/posts/lib/post-title";

export type PostFilters = {
  status?: string;
  categoryId?: string;
  folderId?: string;
  tagId?: string;
  isFeatured?: boolean;
  missingCategory?: boolean;
  missingTags?: boolean;
  missingFolder?: boolean;
  missingExcerpt?: boolean;
  missingSeoTitle?: boolean;
  missingSeoDescription?: boolean;
  updatedAfter?: Date;
  query?: string;
  includeArchived?: boolean;
};

export type FindPostsOptions = {
  status?: string;
  categoryId?: string;
  folderId?: string;
  tagId?: string;
  take?: number;
  skip?: number;
  isFeatured?: boolean;
  missingCategory?: boolean;
  missingTags?: boolean;
  missingFolder?: boolean;
  missingExcerpt?: boolean;
  missingSeoTitle?: boolean;
  missingSeoDescription?: boolean;
  updatedAfter?: Date;
  query?: string;
  order?: "created" | "updated" | "published";
  includeArchived?: boolean;
};

export type AdminPostMetricsSnapshot = {
  drafts: number;
  review: number;
  published: number;
  archived: number;
  uncategorized: number;
  untagged: number;
  unfiled: number;
  missingExcerpt: number;
  missingSeoTitle: number;
  missingSeoDescription: number;
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
  seoTitle: true,
  seoDescription: true,
  categoryId: true,
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
} satisfies Prisma.postSelect;

const publicPostCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  contentText: true,
  coverImageUrl: true,
  publishedAt: true,
  createdAt: true,
  readingTimeMinutes: true,
  isFeatured: true,
  category: {
    select: {
      name: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
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
} satisfies Prisma.postSelect;

const postPublishabilitySelect = {
  id: true,
  title: true,
  contentText: true,
  status: true,
} satisfies Prisma.postSelect;

const ACTIVE_POST_STATUSES = ["draft", "review", "published"] as const;

type AdminPostMetricsSnapshotRow = Record<
  keyof AdminPostMetricsSnapshot,
  bigint | number
>;

function toCountNumber(value: bigint | number) {
  return Number(value);
}

export function getPostOrderBy(
  order?: FindPostsOptions["order"],
): Prisma.postOrderByWithRelationInput[] {
  if (order === "published") {
    return [
      { isFeatured: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ];
  }

  if (order === "updated") {
    return [{ updatedAt: "desc" }, { createdAt: "desc" }];
  }

  return [{ createdAt: "desc" }];
}

type PostSelect = typeof postListSelect | typeof publicPostCardSelect;

function findPostsWithSelect<TSelect extends PostSelect>(
  options: FindPostsOptions | undefined,
  select: TSelect,
) {
  return db.post.findMany({
    where: buildPostWhere(options),
    orderBy: getPostOrderBy(options?.order),
    take: options?.take,
    skip: options?.skip,
    select,
  });
}

export function mapAdminPostMetricsSnapshotRow(
  row: AdminPostMetricsSnapshotRow,
): AdminPostMetricsSnapshot {
  return {
    drafts: toCountNumber(row.drafts),
    review: toCountNumber(row.review),
    published: toCountNumber(row.published),
    archived: toCountNumber(row.archived),
    uncategorized: toCountNumber(row.uncategorized),
    untagged: toCountNumber(row.untagged),
    unfiled: toCountNumber(row.unfiled),
    missingExcerpt: toCountNumber(row.missingExcerpt),
    missingSeoTitle: toCountNumber(row.missingSeoTitle),
    missingSeoDescription: toCountNumber(row.missingSeoDescription),
  };
}

function getDefaultActiveStatusWhere(): Prisma.postWhereInput {
  return {
    status: {
      in: [...ACTIVE_POST_STATUSES],
    },
  };
}

function buildPostWhere(filters?: PostFilters): Prisma.postWhereInput {
  const where: Prisma.postWhereInput = filters?.includeArchived
    ? {}
    : getDefaultActiveStatusWhere();
  const andConditions: Prisma.postWhereInput[] = [];

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.missingCategory) {
    where.categoryId = null;
  }

  if (filters?.folderId) {
    where.folderId = filters.folderId;
  }

  if (filters?.missingFolder) {
    where.folderId = null;
  }

  if (filters?.tagId) {
    where.tags = { some: { tagId: filters.tagId } };
  }

  if (filters?.missingTags) {
    where.tags = { none: {} };
  }

  if (filters?.missingExcerpt) {
    andConditions.push({
      OR: [
        { excerpt: null },
        { excerpt: "" },
      ],
    });
  }

  if (filters?.missingSeoTitle) {
    andConditions.push({
      OR: [
        { seoTitle: null },
        { seoTitle: "" },
      ],
    });
  }

  if (filters?.missingSeoDescription) {
    andConditions.push({
      OR: [
        { seoDescription: null },
        { seoDescription: "" },
      ],
    });
  }

  if (typeof filters?.isFeatured === "boolean") {
    where.isFeatured = filters.isFeatured;
  }

  if (filters?.updatedAfter) {
    where.updatedAt = { gte: filters.updatedAfter };
  }

  const query = filters?.query?.trim();
  if (query) {
    andConditions.push({
      OR: [
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
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

export async function findPosts(options?: FindPostsOptions) {
  return findPostsWithSelect(options, postListSelect);
}

export async function findPublicPostCards(options?: FindPostsOptions) {
  return findPostsWithSelect(options, publicPostCardSelect);
}

export async function findAnyPostBySlug(slug: string) {
  return db.post.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      status: true,
    },
  });
}

export async function findPublishedPostBySlug(slug: string) {
  return db.post.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { name: true } },
    },
  });
}

export async function findUntitledPostTitles(createdBy: string) {
  return db.post.findMany({
    where: {
      createdBy,
      ...getDefaultActiveStatusWhere(),
      OR: [
        { title: UNTITLED_POST_TITLE },
        { title: { startsWith: `${UNTITLED_POST_TITLE_PREFIX} ` } },
      ],
    },
    select: {
      title: true,
    },
  });
}

export async function findPostById(id: string) {
  return db.post.findFirst({
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

export async function getAdminPostMetricsSnapshot(): Promise<AdminPostMetricsSnapshot> {
  const activeStatusesSql = Prisma.join(
    ACTIVE_POST_STATUSES.map((status) => Prisma.sql`${status}`),
  );

  const [row] = await db.$queryRaw<AdminPostMetricsSnapshotRow[]>(Prisma.sql`
    WITH post_tag_counts AS (
      SELECT
        pt."postId",
        COUNT(*) AS "tagCount"
      FROM "postTag" pt
      GROUP BY pt."postId"
    )
    SELECT
      COUNT(*) FILTER (WHERE p.status = 'draft') AS "drafts",
      COUNT(*) FILTER (WHERE p.status = 'review') AS "review",
      COUNT(*) FILTER (WHERE p.status = 'published') AS "published",
      COUNT(*) FILTER (WHERE p.status = 'archived') AS "archived",
      COUNT(*) FILTER (
        WHERE p.status IN (${activeStatusesSql})
          AND p."categoryId" IS NULL
      ) AS "uncategorized",
      COUNT(*) FILTER (
        WHERE p.status IN (${activeStatusesSql})
          AND COALESCE(ptc."tagCount", 0) = 0
      ) AS "untagged",
      COUNT(*) FILTER (
        WHERE p.status IN (${activeStatusesSql})
          AND p."folderId" IS NULL
      ) AS "unfiled",
      COUNT(*) FILTER (
        WHERE p.status IN (${activeStatusesSql})
          AND COALESCE(p.excerpt, '') = ''
      ) AS "missingExcerpt",
      COUNT(*) FILTER (
        WHERE p.status IN (${activeStatusesSql})
          AND COALESCE(p."seoTitle", '') = ''
      ) AS "missingSeoTitle",
      COUNT(*) FILTER (
        WHERE p.status IN (${activeStatusesSql})
          AND COALESCE(p."seoDescription", '') = ''
      ) AS "missingSeoDescription"
    FROM "post" p
    LEFT JOIN post_tag_counts ptc
      ON ptc."postId" = p.id
  `);

  return mapAdminPostMetricsSnapshotRow(row);
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
  folderId: string | null;
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
  mediaReferences: Array<{
    mediaId: string;
    usage: "cover" | "content";
  }>;
}) {
  const { tagIds, mediaReferences, contentJson, contentToc, ...postData } = data;

  return db.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        ...postData,
        contentJson: contentJson as Prisma.InputJsonValue,
        contentToc: contentToc as Prisma.InputJsonValue,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    if (mediaReferences.length > 0) {
      await tx.postMediaReference.createMany({
        data: mediaReferences.map((reference) => ({
          postId: post.id,
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
    folderId: string | null;
    status: string;
    publishedAt: Date | null;
    readingTimeMinutes: number;
    wordCount: number;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    isFeatured: boolean;
    tagIds: string[];
    mediaReferences: Array<{
      mediaId: string;
      usage: "cover" | "content";
    }>;
  },
) {
  const { tagIds, mediaReferences, contentJson, contentToc, ...postData } = data;

  return db.$transaction(async (tx) => {
    await tx.postTag.deleteMany({ where: { postId: id } });
    await tx.postMediaReference.deleteMany({ where: { postId: id } });

    const post = await tx.post.update({
      where: { id },
      data: {
        ...postData,
        contentJson: contentJson as Prisma.InputJsonValue,
        contentToc: contentToc as Prisma.InputJsonValue,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    if (mediaReferences.length > 0) {
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

export async function updatePostArchiveStatus(id: string, archived: boolean) {
  return db.post.update({
    where: { id },
    data: {
      status: archived ? "archived" : "draft",
      publishedAt: null,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      category: {
        select: {
          slug: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
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

export async function findPostsByFolder(
  folderId: string,
  options?: Omit<FindPostsOptions, "folderId">,
) {
  return findPosts({
    ...options,
    folderId,
  });
}

export async function findRecentlyUpdatedPosts(
  options?: number | {
    take?: number;
    skip?: number;
  },
) {
  const normalizedOptions = typeof options === "number"
    ? { take: options }
    : options;

  return db.post.findMany({
    where: getDefaultActiveStatusWhere(),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: normalizedOptions?.take,
    skip: normalizedOptions?.skip,
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

export async function findReviewPosts(take = 20) {
  return db.post.findMany({
    where: { status: "review" },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: postListSelect,
  });
}

export async function findDraftPublishabilityCandidates() {
  return db.post.findMany({
    where: { status: "draft" },
    select: postPublishabilitySelect,
  });
}

export async function findPostsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return db.post.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: editablePostSelect,
  });
}

export async function updatePostsStatus(
  ids: string[],
  status: string,
  publishedAtById: Record<string, Date | null>,
) {
  if (ids.length === 0) {
    return [];
  }

  return db.$transaction(async (tx) => {
    for (const id of ids) {
      await tx.post.update({
        where: { id },
        data: {
          status,
          publishedAt: publishedAtById[id] ?? null,
        },
      });
    }

    return tx.post.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: editablePostSelect,
    });
  });
}

export async function updatePostsCategory(ids: string[], categoryId: string | null) {
  if (ids.length === 0) {
    return [];
  }

  await db.post.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      categoryId,
    },
  });

  return findPostsByIds(ids);
}

export async function updatePostsFolder(ids: string[], folderId: string | null) {
  if (ids.length === 0) {
    return [];
  }

  await db.post.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      folderId,
    },
  });

  return findPostsByIds(ids);
}

export async function replacePostsTags(ids: string[], tagIds: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return db.$transaction(async (tx) => {
    await tx.postTag.deleteMany({
      where: {
        postId: {
          in: ids,
        },
      },
    });

    if (tagIds.length > 0) {
      await tx.postTag.createMany({
        data: ids.flatMap((postId) => tagIds.map((tagId) => ({
          postId,
          tagId,
        }))),
      });
    }

    return tx.post.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: editablePostSelect,
    });
  });
}

export async function appendPostsTags(ids: string[], tagIds: string[]) {
  if (ids.length === 0 || tagIds.length === 0) {
    return findPostsByIds(ids);
  }

  return db.$transaction(async (tx) => {
    await tx.postTag.createMany({
      data: ids.flatMap((postId) => tagIds.map((tagId) => ({
        postId,
        tagId,
      }))),
      skipDuplicates: true,
    });

    return tx.post.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: editablePostSelect,
    });
  });
}

export async function removePostsTags(ids: string[], tagIds: string[]) {
  if (ids.length === 0 || tagIds.length === 0) {
    return findPostsByIds(ids);
  }

  return db.$transaction(async (tx) => {
    await tx.postTag.deleteMany({
      where: {
        postId: {
          in: ids,
        },
        tagId: {
          in: tagIds,
        },
      },
    });

    return tx.post.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: editablePostSelect,
    });
  });
}

export async function findPostsReferencingMedia(mediaId: string) {
  return db.post.findMany({
    where: {
      mediaReferences: {
        some: {
          mediaId,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      folder: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      mediaReferences: {
        where: {
          mediaId,
        },
        select: {
          usage: true,
        },
      },
    },
  });
}
