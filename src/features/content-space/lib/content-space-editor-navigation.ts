import type { WorkspacePostSummary } from "./content-space-workspace";

export type ContentSpaceEditorNavigationInput = {
  contextPosts: WorkspacePostSummary[];
  selectedPostId?: string;
};

export type ContentSpaceEditorNavigationModel = {
  previousPost?: WorkspacePostSummary;
  nextPost?: WorkspacePostSummary;
};

export function buildContentSpaceEditorNavigation(
  input: ContentSpaceEditorNavigationInput,
): ContentSpaceEditorNavigationModel {
  const index = input.contextPosts.findIndex(
    (post) => post.id === input.selectedPostId,
  );

  if (index < 0) {
    return {};
  }

  return {
    previousPost: input.contextPosts[index - 1],
    nextPost: input.contextPosts[index + 1],
  };
}
