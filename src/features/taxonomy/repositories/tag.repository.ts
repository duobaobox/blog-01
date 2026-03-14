import { db } from "@/infrastructure/db";

export async function findTags() {
  return db.tag.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function findTagBySlug(slug: string) {
  return db.tag.findUnique({ where: { slug } });
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
  }
) {
  return db.tag.update({ where: { id }, data });
}

export async function deleteTag(id: string) {
  return db.tag.delete({ where: { id } });
}
