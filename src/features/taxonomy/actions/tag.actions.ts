"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminTags } from "@/infrastructure/cache/admin-cache";
import { revalidateTagContent } from "@/infrastructure/cache/content-cache";
import { createTaxonomyActionRunner } from "@/features/taxonomy/actions/taxonomy-action-runner";
import { parseTagWriteFormData } from "@/features/taxonomy/lib/taxonomy-write";
import * as taxonomyService from "@/features/taxonomy/services/taxonomy.service";

const taxonomyActionRunner = createTaxonomyActionRunner({
  taxonomyService,
  revalidateAdminTags,
  revalidateTagContent,
});

export async function createTag(formData: FormData) {
  await requireAdminSession();
  const input = parseTagWriteFormData(formData);
  await taxonomyActionRunner.createTag(input);
}

export async function updateTag(id: string, formData: FormData) {
  await requireAdminSession();
  const input = parseTagWriteFormData(formData);
  await taxonomyActionRunner.updateTag(id, input);
}

export async function deleteTag(id: string) {
  await requireAdminSession();
  await taxonomyActionRunner.deleteTag(id);
}
