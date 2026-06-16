import { db } from "@/infrastructure/db";

export type TaxonomyScope = "admin" | "public";

export async function findCategories(scope: TaxonomyScope = "admin") {
  if (scope === "public") {
    return db.category.findMany({
      where: {
        posts: {
          some: {
            status: "published",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: "published",
              },
            },
          },
        },
      },
    });
  }

  return db.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          posts: {
            where: {
              status: {
                in: ["draft", "review", "published"],
              },
            },
          },
        },
      },
    },
  });
}

export async function findCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function findPublicCategoryBySlug(slug: string) {
  return db.category.findFirst({
    where: {
      slug,
      posts: {
        some: {
          status: "published",
        },
      },
    },
  });
}

export async function findCategoryById(id: string) {
  return db.category.findUnique({ where: { id } });
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description: string | null;
}) {
  return db.category.create({ data });
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    slug: string;
    description: string | null;
  },
) {
  return db.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return db.category.delete({ where: { id } });
}
