"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import { generateTaxonomySlug } from "@/features/taxonomy/services/taxonomy.service";

export async function createTag(formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const color = (formData.get("color") as string) || null;
  const slug = generateTaxonomySlug(
    name,
    (formData.get("slug") as string) || undefined,
  );

  await tagRepo.createTag({ name, slug, description, color });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}

export async function updateTag(id: string, formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = (formData.get("description") as string) || null;
  const color = (formData.get("color") as string) || null;

  await tagRepo.updateTag(id, { name, slug, description, color });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}

export async function deleteTag(id: string) {
  await requireAdminSession();
  await tagRepo.deleteTag(id);
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}
