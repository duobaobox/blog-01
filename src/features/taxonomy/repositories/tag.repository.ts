import { db } from "@/infrastructure/db";
import type { TaxonomyScope } from "@/features/taxonomy/repositories/category.repository";

export async function findTags(scope: TaxonomyScope = "admin") {
  if (scope === "public") {
    return db.tag.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  status: "published",
                },
              },
            },
          },
        },
      },
    });
  }

  return db.tag.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function findTagBySlug(slug: string) {
  return db.tag.findUnique({ where: { slug } });
}

export async function findTagById(id: string) {
  return db.tag.findUnique({ where: { id } });
}

export async function createTag(data: {
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}) {
  return db.tag.create({ data });
}

export async function updateTag(
  id: string,
  data: {
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
  },
) {
  return db.tag.update({ where: { id }, data });
}

export async function deleteTag(id: string) {
  return db.tag.delete({ where: { id } });
}
