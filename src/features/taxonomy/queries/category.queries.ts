import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";

export async function getCategories(
  scope: categoryRepo.TaxonomyScope = "admin",
) {
  return categoryRepo.findCategories(scope);
}

export async function getCategoryBySlug(slug: string) {
  return categoryRepo.findCategoryBySlug(slug);
}
