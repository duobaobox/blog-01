"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import slugify from "slugify";

export async function getCategories() {
  return db.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const slug =
    (formData.get("slug") as string) ||
    slugify(name, { lower: true, strict: true });

  await db.category.create({ data: { name, slug, description } });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = (formData.get("description") as string) || null;

  await db.category.update({
    where: { id },
    data: { name, slug, description },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}
