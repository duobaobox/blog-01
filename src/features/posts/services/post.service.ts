import { materializePostContent } from "@/features/editor/content-materializer";
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
  contentJson: unknown;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  subtopicId: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  tagIds: string[];
  createdBy: string;
}) {
  const slug = await resolveSlug(input.slug, input.title);
  const materialized = await materializePostContent(input.contentJson);
  const publishedAt = input.status === "published" ? new Date() : null;

  return postRepo.createPost({
    title: input.title,
    slug,
    contentJson: materialized.contentJson,
    contentHtml: materialized.contentHtml,
    contentText: materialized.contentText,
    contentToc: materialized.contentToc,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    subtopicId: input.subtopicId || null,
    status: input.status,
    publishedAt,
    readingTimeMinutes: materialized.readingTimeMinutes,
    wordCount: materialized.wordCount,
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
    contentJson: unknown;
    excerpt: string | null;
    coverImageUrl: string | null;
    categoryId: string | null;
    subtopicId: string | null;
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
  const materialized = await materializePostContent(input.contentJson);

  let publishedAt = existingPost?.publishedAt || null;
  if (input.status === "published" && !publishedAt) {
    publishedAt = new Date();
  }

  return postRepo.updatePost(id, {
    title: input.title,
    slug,
    contentJson: materialized.contentJson,
    contentHtml: materialized.contentHtml,
    contentText: materialized.contentText,
    contentToc: materialized.contentToc,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    subtopicId: input.subtopicId || null,
    status: input.status,
    publishedAt,
    readingTimeMinutes: materialized.readingTimeMinutes,
    wordCount: materialized.wordCount,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    isFeatured: input.isFeatured,
    tagIds: input.tagIds,
  });
}
