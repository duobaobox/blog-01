import type { PostSaveIntent } from "@/features/posts/lib/post-save-plan";
import {
  createLatestTaskCoordinator,
  getPostSaveIntentPriority,
} from "@/features/posts/lib/post-save-coordinator";
import * as serverActions from "./post.actions.server";

const postWriteCoordinator = createLatestTaskCoordinator();

function getSaveIntent(formData: FormData): PostSaveIntent {
  const value = formData.get("saveIntent");

  return value === "autosave" ||
    value === "manual" ||
    value === "navigation" ||
    value === "publish"
    ? value
    : "manual";
}

export function createPost(formData: FormData) {
  const intent = getSaveIntent(formData);

  return postWriteCoordinator.run(
    () => serverActions.createPost(formData),
    getPostSaveIntentPriority(intent),
  );
}

export function updatePost(id: string, formData: FormData) {
  const intent = getSaveIntent(formData);

  return postWriteCoordinator.run(
    () => serverActions.updatePost(id, formData),
    getPostSaveIntentPriority(intent),
  );
}

export function createEmptyPost(
  input: Parameters<typeof serverActions.createEmptyPost>[0],
) {
  return serverActions.createEmptyPost(input);
}

export function deletePost(id: string) {
  return serverActions.deletePost(id);
}

export function applyBulkPostAction(formData: FormData) {
  return serverActions.applyBulkPostAction(formData);
}
