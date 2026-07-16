import { db } from "@/infrastructure/db";

const CONTENT_TREE_POST_PREVIEW_LIMIT = 3;
const ACTIVE_POST_STATUSES = ["draft", "review", "published"] as const;

export async function findFolders() {
  return db.folder.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: {
              status: {
                in: [...ACTIVE_POST_STATUSES],
              },
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findFoldersWithPostPreviews() {
  return db.folder.findMany({
    include: {
      _count: {
        select: {
          posts: {
            where: {
              status: {
                in: [...ACTIVE_POST_STATUSES],
              },
            },
          },
        },
      },
      posts: {
        where: {
          status: {
            in: [...ACTIVE_POST_STATUSES],
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: CONTENT_TREE_POST_PREVIEW_LIMIT,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          folderId: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findFolderBySlug(slug: string) {
  return db.folder.findUnique({ where: { slug } });
}

export async function findFolderById(id: string) {
  return db.folder.findUnique({ where: { id } });
}

export async function findFolderByIdWithPostCount(id: string) {
  return db.folder.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              status: {
                in: [...ACTIVE_POST_STATUSES],
              },
            },
          },
        },
      },
    },
  });
}

export async function createFolder(data: {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}) {
  return db.folder.create({ data });
}

export async function updateFolder(
  id: string,
  data: {
    name: string;
    description?: string | null;
  },
) {
  return db.folder.update({ where: { id }, data });
}

export async function deleteFolder(id: string) {
  return db.$transaction(async (tx) => {
    await tx.post.deleteMany({ where: { folderId: id } });
    return tx.folder.delete({ where: { id } });
  });
}
