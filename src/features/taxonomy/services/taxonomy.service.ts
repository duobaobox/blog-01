import slugify from "slugify";

export function generateTaxonomySlug(name: string, customSlug?: string): string {
  if (customSlug) {
    return slugify(customSlug, { lower: true, strict: true });
  }
  return slugify(name, { lower: true, strict: true });
}
