import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import type { TaxonomyScope } from "@/features/taxonomy/repositories/category.repository";

export async function getTags(scope: TaxonomyScope = "admin") {
  return tagRepo.findTags(scope);
}

export async function getTagBySlug(slug: string) {
  return tagRepo.findTagBySlug(slug);
}
