import slugifyLib from "slugify";
import { pinyin } from "pinyin-pro";

const DEFAULT_SLUG_LENGTH = 8;

function randomSegment(length = DEFAULT_SLUG_LENGTH) {
  return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, length);
}

export function generateShortSlug(
  prefix = "item",
  length = DEFAULT_SLUG_LENGTH,
) {
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

/**
 * Convert arbitrary text (including Chinese) into a URL-safe slug.
 * Chinese characters are romanized via pinyin; everything else is
 * handled by the slugify library.
 */
export function slugifyText(text: string): string {
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const base = hasChinese
    ? pinyin(text, { toneType: "none", separator: " " })
    : text;
  return slugifyLib(base, { lower: true, strict: true, trim: true });
}

/**
 * Given a user-provided slug or a title, produce a unique slug.
 * Priority: userSlug > title-based slug > random prefix slug.
 */
export async function generateSemanticSlug(
  exists: (slug: string) => Promise<boolean>,
  opts: { userSlug?: string; title?: string; prefix?: string },
): Promise<string> {
  const { userSlug, title, prefix = "p" } = opts;

  // Internal callers may pass a preferred slug, but it still goes through
  // the same normalization path as title-derived slugs.
  const raw = userSlug ? slugifyText(userSlug) : title ? slugifyText(title) : "";

  if (!raw) {
    return generateUniqueShortSlug(exists, prefix);
  }

  let candidate = raw;
  if (!(await exists(candidate))) return candidate;

  // Append a short suffix to deduplicate
  for (let i = 2; i <= 20; i++) {
    candidate = `${raw}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Very unlikely, but fall back to random
  return generateUniqueShortSlug(exists, prefix);
}
