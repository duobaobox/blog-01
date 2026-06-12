import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSidebarExpansionState,
  getVisiblePostsForSidebarSubtopic,
  type SidebarExpansionInput,
} from "./content-space-sidebar-state";

function createInput(
  overrides?: Partial<SidebarExpansionInput>,
): SidebarExpansionInput {
  return {
    topicId: "topic-1",
    subtopicId: "subtopic-1",
    activeTopicId: "topic-1",
    activeSubtopicId: "subtopic-1",
    activePostId: "post-1",
    expandedTopicIds: [],
    expandedSubtopicIds: [],
    forceExpandAllForSearch: false,
    ...overrides,
  };
}

test("deriveSidebarExpansionState expands the active topic and subtopic", () => {
  const state = deriveSidebarExpansionState(createInput());

  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, true);
});

test("deriveSidebarExpansionState respects user-expanded topics even when inactive", () => {
  const state = deriveSidebarExpansionState(
    createInput({
      topicId: "topic-2",
      subtopicId: "subtopic-2",
      activeTopicId: "topic-1",
      activeSubtopicId: "subtopic-1",
      activePostId: undefined,
      expandedTopicIds: ["topic-2"],
    }),
  );

  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, false);
});

test("deriveSidebarExpansionState forces expansion during search mode", () => {
  const state = deriveSidebarExpansionState(
    createInput({
      topicId: "topic-2",
      subtopicId: "subtopic-2",
      activeTopicId: undefined,
      activeSubtopicId: undefined,
      activePostId: undefined,
      forceExpandAllForSearch: true,
    }),
  );

  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, true);
});

test("getVisiblePostsForSidebarSubtopic caps items until expanded", () => {
  const posts = Array.from({ length: 8 }, (_, index) => ({
    id: `post-${index + 1}`,
  }));

  const collapsed = getVisiblePostsForSidebarSubtopic(posts, false, 5);
  const expanded = getVisiblePostsForSidebarSubtopic(posts, true, 5);

  assert.equal(collapsed.items.length, 5);
  assert.equal(collapsed.hiddenCount, 3);
  assert.equal(expanded.items.length, 8);
  assert.equal(expanded.hiddenCount, 0);
});
