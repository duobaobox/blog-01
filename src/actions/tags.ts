"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import slugify from "slugify";

export async function getTags() {
  return db.tag.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function getTagBySlug(slug: string) {
  return db.tag.findUnique({ where: { slug } });
}

export async function createTag(formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const color = (formData.get("color") as string) || null;
  const slug =
    (formData.get("slug") as string) ||
    slugify(name, { lower: true, strict: true });

  await db.tag.create({ data: { name, slug, description, color } });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}

export async function updateTag(id: string, formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = (formData.get("description") as string) || null;
  const color = (formData.get("color") as string) || null;

  await db.tag.update({
    where: { id },
    data: { name, slug, description, color },
  });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}

export async function deleteTag(id: string) {
  await requireAdminSession();
  await db.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}
