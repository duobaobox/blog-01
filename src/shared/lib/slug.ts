const DEFAULT_SLUG_LENGTH = 8;

function randomSegment(length = DEFAULT_SLUG_LENGTH) {
  return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, length);
}

export function generateShortSlug(prefix = "item", length = DEFAULT_SLUG_LENGTH) {
  return `${prefix}-${randomSegment(length)}`;
}

export async function generateUniqueShortSlug(
  exists: (slug: string) => Promise<boolean>,
  prefix = "item",
  length = DEFAULT_SLUG_LENGTH,
) {
  let slug = generateShortSlug(prefix, length);

  while (await exists(slug)) {
    slug = generateShortSlug(prefix, length);
  }

  return slug;
}
