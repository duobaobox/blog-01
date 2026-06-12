export type SidebarExpansionInput = {
  topicId: string;
  subtopicId: string;
  activeTopicId?: string;
  activeSubtopicId?: string;
  activePostId?: string;
  expandedTopicIds: string[];
  expandedSubtopicIds: string[];
  forceExpandAllForSearch: boolean;
};

export function deriveSidebarExpansionState(input: SidebarExpansionInput) {
  const topicExpanded =
    input.forceExpandAllForSearch ||
    input.expandedTopicIds.includes(input.topicId) ||
    input.activeTopicId === input.topicId ||
    input.activeSubtopicId === input.subtopicId;

  const subtopicExpanded =
    input.forceExpandAllForSearch ||
    input.expandedSubtopicIds.includes(input.subtopicId) ||
    input.activeSubtopicId === input.subtopicId ||
    (input.activePostId !== undefined &&
      input.activeTopicId === input.topicId &&
      input.activeSubtopicId === input.subtopicId);

  return {
    topicExpanded,
    subtopicExpanded,
  };
}
