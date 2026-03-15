"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import { normalizeTagColor } from "@/features/taxonomy/lib/tag-color";
import { generateUniqueTaxonomySlug } from "@/features/taxonomy/services/taxonomy.service";

export async function createTag(formData: FormData) {
  await requireAdminSession();
  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const color = normalizeTagColor(formData.get("color") as string);

  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const slug = await generateUniqueTaxonomySlug(
    async (value) => Boolean(await tagRepo.findTagBySlug(value)),
    "t",
  );

  await tagRepo.createTag({
    name,
    slug,
    description: description || null,
    color,
  });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}

export async function updateTag(id: string, formData: FormData) {
  await requireAdminSession();
  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();
  const color = normalizeTagColor(formData.get("color") as string);

  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const tag = await tagRepo.findTagById(id);

  if (!tag) {
    throw new Error("标签不存在");
  }

  await tagRepo.updateTag(id, {
    name,
    slug: tag.slug,
    description: description || null,
    color,
  });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}

export async function deleteTag(id: string) {
  await requireAdminSession();
  await tagRepo.deleteTag(id);
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}
