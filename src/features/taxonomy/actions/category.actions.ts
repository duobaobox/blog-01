"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminCategories } from "@/infrastructure/cache/admin-cache";
import { revalidateCategoryContent } from "@/infrastructure/cache/content-cache";
import { createTaxonomyActionRunner } from "@/features/taxonomy/actions/taxonomy-action-runner";
import { parseCategoryWriteFormData } from "@/features/taxonomy/lib/taxonomy-write";
import * as taxonomyService from "@/features/taxonomy/services/taxonomy.service";

const taxonomyActionRunner = createTaxonomyActionRunner({
  taxonomyService,
  revalidateAdminCategories,
  revalidateCategoryContent,
});

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const input = parseCategoryWriteFormData(formData);
  await taxonomyActionRunner.createCategory(input);
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const input = parseCategoryWriteFormData(formData);
  await taxonomyActionRunner.updateCategory(id, input);
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  await taxonomyActionRunner.deleteCategory(id);
}
