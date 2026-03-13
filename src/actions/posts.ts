"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import slugify from "slugify";
import readingTime from "reading-time";
import { pinyin } from "pinyin-pro";

function generateSlug(title: string, customSlug?: string): string {
  // If custom slug is provided, use it
  if (customSlug) {
    return slugify(customSlug, { lower: true, strict: true });
  }

  // First try to slugify the title directly
  let slug = slugify(title, { lower: true, strict: true });

  // If slug is empty (pure Chinese), convert to pinyin first
  if (!slug) {
    const pinyinText = pinyin(title, { toneType: "none", separator: "-" });
    slug = slugify(pinyinText, { lower: true, strict: true });
  }

  // If still empty, use a timestamp
  if (!slug) {
    slug = `post-${Date.now()}`;
  }

  return slug;
}

export async function getPosts(options?: {
  status?: string;
  categoryId?: string;
  tagId?: string;
  take?: number;
  skip?: number;
}) {
  const where: Record<string, unknown> = {};
  if (options?.status) where.status = options.status;
  if (options?.categoryId) where.categoryId = options.categoryId;
  if (options?.tagId) where.tags = { some: { tagId: options.tagId } };

  return db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.take,
    skip: options?.skip,
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { name: true } },
    },
  });
}

export async function getPostBySlug(slug: string) {
  return db.post.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { name: true } },
    },
  });
}

export async function getPostById(id: string) {
  return db.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });
}

export async function getPostCount(status?: string) {
  return db.post.count({ where: status ? { status } : undefined });
}

export async function createPost(formData: FormData) {
  const session = await requireAdminSession();
  const title = formData.get("title") as string;
  const contentMarkdown = formData.get("contentMarkdown") as string;
  const excerpt = (formData.get("excerpt") as string) || null;
  const coverImageUrl = (formData.get("coverImageUrl") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || null;
  const status = (formData.get("status") as string) || "draft";
  const seoTitle = (formData.get("seoTitle") as string) || null;
  const seoDescription = (formData.get("seoDescription") as string) || null;
  const canonicalUrl = (formData.get("canonicalUrl") as string) || null;
  const isFeatured = formData.get("isFeatured") === "true";
  const tagIds = formData.getAll("tagIds") as string[];

  const slug = generateSlug(
    title,
    (formData.get("slug") as string) || undefined,
  );

  const stats = readingTime(contentMarkdown);
  const wordCount = contentMarkdown.length;
  const readingTimeMinutes = Math.ceil(stats.minutes);

  const publishedAt = status === "published" ? new Date() : null;

  const post = await db.post.create({
    data: {
      title,
      slug,
      excerpt,
      coverImageUrl,
      contentMarkdown,
      status,
      categoryId: categoryId || null,
      publishedAt,
      readingTimeMinutes,
      wordCount,
      seoTitle,
      seoDescription,
      canonicalUrl,
      isFeatured,
      createdBy: session.user.id,
      tags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  return post;
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdminSession();
  const title = formData.get("title") as string;
  const slug = generateSlug(
    title,
    (formData.get("slug") as string) || undefined,
  );
  const contentMarkdown = formData.get("contentMarkdown") as string;
  const excerpt = (formData.get("excerpt") as string) || null;
  const coverImageUrl = (formData.get("coverImageUrl") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || null;
  const status = (formData.get("status") as string) || "draft";
  const seoTitle = (formData.get("seoTitle") as string) || null;
  const seoDescription = (formData.get("seoDescription") as string) || null;
  const canonicalUrl = (formData.get("canonicalUrl") as string) || null;
  const isFeatured = formData.get("isFeatured") === "true";
  const tagIds = formData.getAll("tagIds") as string[];

  const stats = readingTime(contentMarkdown);
  const wordCount = contentMarkdown.length;
  const readingTimeMinutes = Math.ceil(stats.minutes);

  const existing = await db.post.findUnique({ where: { id } });
  const publishedAt =
    status === "published" && !existing?.publishedAt
      ? new Date()
      : existing?.publishedAt;

  const post = await db.post.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt,
      coverImageUrl,
      contentMarkdown,
      status,
      categoryId: categoryId || null,
      publishedAt,
      readingTimeMinutes,
      wordCount,
      seoTitle,
      seoDescription,
      canonicalUrl,
      isFeatured,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return post;
}

export async function deletePost(id: string) {
  await requireAdminSession();
  const post = await db.post.delete({ where: { id } });
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
}
