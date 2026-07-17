"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import {
  revalidateAdminPostTags,
  revalidateAdminPosts,
} from "@/infrastructure/cache/admin-cache";
import { revalidatePostsContent } from "@/infrastructure/cache/content-cache";
import { createPostActionRunner } from "@/features/posts/actions/post-action-runner";
import { parsePostBulkActionFormData } from "@/features/posts/lib/post-bulk-action";
import {
  parsePostWriteFormData,
  type PostStatus,
} from "@/features/posts/lib/post-write";
import { updatePostIncrementally } from "@/features/posts/services/post-save.service";
import * as postService from "@/features/posts/services/post.service";
import { normalizeOptionalString } from "@/shared/lib/validation";

const postActionRunner = createPostActionRunner({
  postService: {
    createPost: postService.createPost,
    createEmptyPost: postService.createEmptyPost,
    updatePost: updatePostIncrementally,
    deletePost: postService.deletePost,
    applyBulkAction: postService.applyBulkAction,
  },
  revalidateAdminPosts,
  revalidateAdminPostTags,
  revalidatePostsContent,
});

export async function createPost(formData: FormData) {
  const session = await requireAdminSession();
  const input = parsePostWriteFormData(formData);

  return postActionRunner.createPost({
    ...input,
    createdBy: session.user.id,
  });
}

export async function createEmptyPost(input: {
  folderId?: string | null;
  status?: PostStatus;
}) {
  const session = await requireAdminSession();

  return postActionRunner.createEmptyPost({
    createdBy: session.user.id,
    folderId: normalizeOptionalString(input.folderId),
    status: input.status ?? "draft",
  });
}

export async function updatePost(id: string, formData: FormData) {
  const session = await requireAdminSession();
  const input = parsePostWriteFormData(formData);

  return postActionRunner.updatePost(id, {
    ...input,
    updatedBy: session.user.id,
  });
}

export async function deletePost(id: string) {
  const session = await requireAdminSession();
  await postActionRunner.deletePost({
    id,
    deletedBy: session.user.id,
  });
}

export async function applyBulkPostAction(formData: FormData) {
  const session = await requireAdminSession();
  const input = parsePostBulkActionFormData(formData);
  return postActionRunner.applyBulkAction({
    ...input,
    updatedBy: session.user.id,
  });
}
