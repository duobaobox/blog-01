import { materializePostContent } from "@/features/editor/content-materializer";
import {
  getUntitledPostTitleByIndex,
  UNTITLED_POST_TITLE,
  UNTITLED_POST_TITLE_PREFIX,
} from "@/features/posts/lib/post-title";
import * as postRepo from "@/features/posts/repositories/post.repository";
import { generateSemanticSlug } from "@/shared/lib/slug";

async function resolveSlug(userSlug?: string, title?: string) {
  return generateSemanticSlug(
    async (slug) => Boolean(await postRepo.findPostBySlug(slug)),
    { userSlug, title, prefix: "p" },
  );
}

async function resolveUntitledPostTitle(createdBy: string) {
  const untitledTitles = await postRepo.findUntitledPostTitles(createdBy);
  const usedIndexes = new Set<number>();

  for (const { title } of untitledTitles) {
    if (title === UNTITLED_POST_TITLE) {
      usedIndexes.add(1);
      continue;
    }

    const match = title.match(
      new RegExp(`^${UNTITLED_POST_TITLE_PREFIX} (\\d+)$`),
    );
    if (!match) continue;

    const index = Number.parseInt(match[1] ?? "", 10);
    if (Number.isFinite(index) && index >= 1) {
      usedIndexes.add(index);
    }
  }

  let nextIndex = 1;
  while (usedIndexes.has(nextIndex)) {
    nextIndex += 1;
  }

  return getUntitledPostTitleByIndex(nextIndex);
}

export async function createPost(input: {
  title: string;
  slug?: string;
  contentJson: unknown;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  folderId: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  tagIds: string[];
  createdBy: string;
}) {
  const normalizedTitle = input.title.trim()
    ? input.title.trim()
    : await resolveUntitledPostTitle(input.createdBy);
  const slug = await resolveSlug(input.slug, normalizedTitle);
  const materialized = await materializePostContent(input.contentJson);
  const publishedAt = input.status === "published" ? new Date() : null;

  return postRepo.createPost({
    title: normalizedTitle,
    slug,
    contentJson: materialized.contentJson,
    contentHtml: materialized.contentHtml,
    contentText: materialized.contentText,
    contentToc: materialized.contentToc,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    folderId: input.folderId || null,
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
    folderId: string | null;
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
    folderId: input.folderId || null,
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
