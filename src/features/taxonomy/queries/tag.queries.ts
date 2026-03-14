import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";

export async function getTags() {
  return tagRepo.findTags();
}

export async function getTagBySlug(slug: string) {
  return tagRepo.findTagBySlug(slug);
}
