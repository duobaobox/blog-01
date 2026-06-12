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
    input.topicId === input.activeTopicId ||
    input.expandedTopicIds.includes(input.topicId);

  const subtopicExpanded =
    input.forceExpandAllForSearch ||
    input.subtopicId === input.activeSubtopicId ||
    (input.activePostId ? input.subtopicId === input.activeSubtopicId : false) ||
    input.expandedSubtopicIds.includes(input.subtopicId);

  return {
    topicExpanded,
    subtopicExpanded,
  };
}

export function getVisiblePostsForSidebarSubtopic<T>(
  posts: T[],
  expanded: boolean,
  collapsedLimit = 5,
) {
  const items = expanded ? posts : posts.slice(0, collapsedLimit);
  return {
    items,
    hiddenCount: Math.max(0, posts.length - items.length),
  };
}
