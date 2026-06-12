import type { WorkspacePostSummary } from "./content-space-workspace";

export type ContentSpaceEditorOutlineInput = {
  contextPosts: WorkspacePostSummary[];
  selectedPostId?: string;
};

export type ContentSpaceEditorOutlineModel = {
  activeIndex: number;
  total: number;
  items: WorkspacePostSummary[];
};

export function buildContentSpaceEditorOutline(
  input: ContentSpaceEditorOutlineInput,
): ContentSpaceEditorOutlineModel | null {
  const activeIndex = input.contextPosts.findIndex(
    (post) => post.id === input.selectedPostId,
  );

  if (activeIndex < 0) {
    return null;
  }

  return {
    activeIndex,
    total: input.contextPosts.length,
    items: input.contextPosts,
  };
}
