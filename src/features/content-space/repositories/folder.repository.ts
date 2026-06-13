import { db } from "@/infrastructure/db";

export async function findFolders() {
  return db.folder.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findFolderBySlug(slug: string) {
  return db.folder.findUnique({ where: { slug } });
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
  return db.folder.delete({ where: { id } });
}
