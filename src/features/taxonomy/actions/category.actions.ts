"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";
import { generateUniqueTaxonomySlug } from "@/features/taxonomy/services/taxonomy.service";

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();

  if (!name) {
    throw new Error("分类名称不能为空");
  }

  const slug = await generateUniqueTaxonomySlug(
    async (value) => Boolean(await categoryRepo.findCategoryBySlug(value)),
    "c",
  );

  await categoryRepo.createCategory({
    name,
    slug,
    description: description || null,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const name = ((formData.get("name") as string) || "").trim();
  const description = ((formData.get("description") as string) || "").trim();

  if (!name) {
    throw new Error("分类名称不能为空");
  }

  const category = await categoryRepo.findCategoryById(id);

  if (!category) {
    throw new Error("分类不存在");
  }

  await categoryRepo.updateCategory(id, {
    name,
    slug: category.slug,
    description: description || null,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  await categoryRepo.deleteCategory(id);
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}
