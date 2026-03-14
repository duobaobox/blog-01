import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";

export async function getCategories() {
  return categoryRepo.findCategories();
}

export async function getCategoryBySlug(slug: string) {
  return categoryRepo.findCategoryBySlug(slug);
}
