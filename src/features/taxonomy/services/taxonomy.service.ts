import { generateUniqueShortSlug } from "@/shared/lib/slug";

export async function generateUniqueTaxonomySlug(
  exists: (slug: string) => Promise<boolean>,
  fallbackPrefix: string,
) {
  return generateUniqueShortSlug(exists, fallbackPrefix);
}
