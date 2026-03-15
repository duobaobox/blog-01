import { db } from "@/infrastructure/db";

export async function findCategories() {
  return db.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function findCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
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
  }
) {
  return db.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return db.category.delete({ where: { id } });
}
