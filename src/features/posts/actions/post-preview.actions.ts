"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { getPostById } from "@/features/posts/queries/post.queries";
import { buildPostPreviewPayload } from "@/features/posts/services/post-preview.service";
import { NotFoundError } from "@/shared/lib/app-error";

export async function getPostPreview(postId: string) {
  const session = await requireAdminSession();
  const post = await getPostById(postId);

  if (!post) {
    throw new NotFoundError("文章不存在");
  }

  return buildPostPreviewPayload({
    post,
    authorName: session.user.name ?? "Admin",
  });
}
