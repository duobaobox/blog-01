import slugify from "slugify";
import { pinyin } from "pinyin-pro";
import readingTime from "reading-time";
import * as postRepo from "@/features/posts/repositories/post.repository";

function generateSlug(title: string, customSlug?: string): string {
  const base = customSlug || title;
  let slug = slugify(base, { lower: true, strict: true });

  if (!slug) {
    const py = pinyin(base, { toneType: "none", type: "array" }).join("-");
    slug = slugify(py, { lower: true, strict: true });
  }

  if (!slug) {
    slug = `post-${Date.now()}`;
  }

  return slug;
}

export async function createPost(input: {
  title: string;
  slug?: string;
  contentMarkdown: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  tagIds: string[];
  createdBy: string;
}) {
  const slug = generateSlug(input.title, input.slug);
  const stats = readingTime(input.contentMarkdown);
  const readingTimeMinutes = Math.ceil(stats.minutes);
  const wordCount = stats.words;
  const publishedAt = input.status === "published" ? new Date() : null;

  return postRepo.createPost({
    title: input.title,
    slug,
    contentMarkdown: input.contentMarkdown,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    status: input.status,
    publishedAt,
    readingTimeMinutes,
    wordCount,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    isFeatured: input.isFeatured,
    createdBy: input.createdBy,
    tagIds: input.tagIds,
  });
}

export async function updatePost(
  id: string,
  input: {
    title: string;
    slug?: string;
    contentMarkdown: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    categoryId: string | null;
    status: string;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    isFeatured: boolean;
    tagIds: string[];
  }
) {
  const existingPost = await postRepo.findPostById(id);
  const slug = input.slug
    ? generateSlug(input.title, input.slug)
    : existingPost?.slug || generateSlug(input.title);

  const stats = readingTime(input.contentMarkdown);
  const readingTimeMinutes = Math.ceil(stats.minutes);
  const wordCount = stats.words;

  let publishedAt = existingPost?.publishedAt || null;
  if (input.status === "published" && !publishedAt) {
    publishedAt = new Date();
  }

  return postRepo.updatePost(id, {
    title: input.title,
    slug,
    contentMarkdown: input.contentMarkdown,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    status: input.status,
    publishedAt,
    readingTimeMinutes,
    wordCount,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    isFeatured: input.isFeatured,
    tagIds: input.tagIds,
  });
}
