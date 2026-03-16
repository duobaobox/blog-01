import readingTime from "reading-time";
import * as postRepo from "@/features/posts/repositories/post.repository";
import { generateSemanticSlug } from "@/shared/lib/slug";

async function resolveSlug(userSlug?: string, title?: string) {
  return generateSemanticSlug(
    async (slug) => Boolean(await postRepo.findPostBySlug(slug)),
    { userSlug, title, prefix: "p" },
  );
}

export async function createPost(input: {
  title: string;
  slug?: string;
  contentJson: unknown | null;
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
  const slug = await resolveSlug(input.slug, input.title);
  const stats = readingTime(input.contentMarkdown);
  const readingTimeMinutes =
    stats.words > 0 ? Math.max(1, Math.ceil(stats.minutes)) : 0;
  const wordCount = stats.words;
  const publishedAt = input.status === "published" ? new Date() : null;

  return postRepo.createPost({
    title: input.title,
    slug,
    contentJson: input.contentJson,
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
    contentJson: unknown | null;
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
  },
) {
  const existingPost = await postRepo.findPostById(id);
  const slug =
    existingPost?.slug || (await resolveSlug(input.slug, input.title));

  const stats = readingTime(input.contentMarkdown);
  const readingTimeMinutes =
    stats.words > 0 ? Math.max(1, Math.ceil(stats.minutes)) : 0;
  const wordCount = stats.words;

  let publishedAt = existingPost?.publishedAt || null;
  if (input.status === "published" && !publishedAt) {
    publishedAt = new Date();
  }

  return postRepo.updatePost(id, {
    title: input.title,
    slug,
    contentJson: input.contentJson,
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
