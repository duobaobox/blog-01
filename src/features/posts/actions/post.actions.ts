"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as postRepo from "@/features/posts/repositories/post.repository";
import * as postService from "@/features/posts/services/post.service";

function parseContentJson(formData: FormData) {
  const raw = formData.get("contentJson");

  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  return JSON.parse(raw);
}

export async function createPost(formData: FormData) {
  const session = await requireAdminSession();

  const post = await postService.createPost({
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || undefined,
    contentJson: parseContentJson(formData),
    contentMarkdown: formData.get("contentMarkdown") as string,
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

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  return post;
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdminSession();

  const post = await postService.updatePost(id, {
    title: formData.get("title") as string,
    slug: (formData.get("slug") as string) || undefined,
    contentJson: parseContentJson(formData),
    contentMarkdown: formData.get("contentMarkdown") as string,
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

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  return post;
}

export async function deletePost(id: string) {
  await requireAdminSession();
  const post = await postRepo.deletePost(id);
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
}
