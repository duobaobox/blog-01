"use server";

import { revalidatePath } from "next/cache";
import { parseStoredContentJsonStrict } from "@/features/editor/content-types";
import { requireAdminSession } from "@/infrastructure/auth";
import * as postRepo from "@/features/posts/repositories/post.repository";
import * as postService from "@/features/posts/services/post.service";

function parseContentJson(formData: FormData) {
  const raw = formData.get("contentJson");

  if (typeof raw !== "string" || !raw.trim()) {
    return parseStoredContentJsonStrict("");
  }

  return parseStoredContentJsonStrict(raw);
}

function revalidateAdminPostRoutes() {
  revalidatePath("/admin/posts");
}

function revalidatePublishedPostRoutes(slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/categories", "layout");
  revalidatePath("/blog/tags", "layout");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");

  for (const slug of new Set(
    slugs.filter((value): value is string => typeof value === "string" && value.length > 0),
  )) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function createPost(formData: FormData) {
  const session = await requireAdminSession();

  const post = await postService.createPost({
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || undefined,
    contentJson: parseContentJson(formData),
    excerpt: (formData.get("excerpt") as string) || null,
    coverImageUrl: (formData.get("coverImageUrl") as string) || null,
    categoryId: (formData.get("categoryId") as string) || null,
    status: (formData.get("status") as string) || "draft",
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
    canonicalUrl: (formData.get("canonicalUrl") as string) || null,
    isFeatured: formData.get("isFeatured") === "true",
    tagIds: formData.getAll("tagIds") as string[],
    createdBy: session.user.id,
  });

  revalidateAdminPostRoutes();

  if (post.status === "published") {
    revalidatePublishedPostRoutes([post.slug]);
  }

  return post;
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdminSession();
  const existingPost = await postRepo.findPostById(id);

  const post = await postService.updatePost(id, {
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || undefined,
    contentJson: parseContentJson(formData),
    excerpt: (formData.get("excerpt") as string) || null,
    coverImageUrl: (formData.get("coverImageUrl") as string) || null,
    categoryId: (formData.get("categoryId") as string) || null,
    status: (formData.get("status") as string) || "draft",
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
    canonicalUrl: (formData.get("canonicalUrl") as string) || null,
    isFeatured: formData.get("isFeatured") === "true",
    tagIds: formData.getAll("tagIds") as string[],
  });

  revalidateAdminPostRoutes();

  if (existingPost?.status === "published" || post.status === "published") {
    revalidatePublishedPostRoutes([existingPost?.slug, post.slug]);
  }

  return post;
}

export async function deletePost(id: string) {
  await requireAdminSession();
  const post = await postRepo.deletePost(id);
  revalidateAdminPostRoutes();

  if (post.status === "published") {
    revalidatePublishedPostRoutes([post.slug]);
  }
}
