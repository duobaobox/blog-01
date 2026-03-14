"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";
import { generateTaxonomySlug } from "@/features/taxonomy/services/taxonomy.service";

export async function getCategories() {
  return categoryRepo.findCategories();
}

export async function getCategoryBySlug(slug: string) {
  return categoryRepo.findCategoryBySlug(slug);
}

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const slug = generateTaxonomySlug(
    name,
    (formData.get("slug") as string) || undefined
  );

  await categoryRepo.createCategory({ name, slug, description });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = (formData.get("description") as string) || null;

  await categoryRepo.updateCategory(id, { name, slug, description });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  await categoryRepo.deleteCategory(id);
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}
