import { createPostSaveCoordinator } from "@/features/posts/lib/post-save-coordinator";
import * as serverActions from "./post.actions.server";

const postWriteCoordinator = createPostSaveCoordinator();

export function createPost(formData: FormData) {
  return postWriteCoordinator.run(() => serverActions.createPost(formData));
}

export function updatePost(id: string, formData: FormData) {
  return postWriteCoordinator.run(() => serverActions.updatePost(id, formData));
}

export function createEmptyPost(
  input: Parameters<typeof serverActions.createEmptyPost>[0],
) {
  return serverActions.createEmptyPost(input);
}

export function deletePost(id: string) {
  return serverActions.deletePost(id);
}

export function restorePost(id: string) {
  return serverActions.restorePost(id);
}

export function applyBulkPostAction(formData: FormData) {
  return serverActions.applyBulkPostAction(formData);
}
