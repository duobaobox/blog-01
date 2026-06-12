import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSidebarExpansionState,
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

test("deriveSidebarExpansionState expands the active topic and active subtopic", () => {
  const state = deriveSidebarExpansionState(
    createInput({
      activePostId: undefined,
    }),
  );

  assert.equal(state.topicExpanded, true);
  assert.equal(state.subtopicExpanded, true);
});

test("deriveSidebarExpansionState respects user-expanded topics and subtopics even when inactive", () => {
  const topicState = deriveSidebarExpansionState(
    createInput({
      topicId: "topic-2",
      subtopicId: "subtopic-2",
      activeTopicId: "topic-1",
      activeSubtopicId: "subtopic-1",
      activePostId: undefined,
      expandedTopicIds: ["topic-2"],
    }),
  );
  const subtopicState = deriveSidebarExpansionState(
    createInput({
      topicId: "topic-2",
      subtopicId: "subtopic-2",
      activeTopicId: "topic-1",
      activeSubtopicId: "subtopic-1",
      activePostId: undefined,
      expandedSubtopicIds: ["subtopic-2"],
    }),
  );

  assert.equal(topicState.topicExpanded, true);
  assert.equal(topicState.subtopicExpanded, false);
  assert.equal(subtopicState.topicExpanded, false);
  assert.equal(subtopicState.subtopicExpanded, true);
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

test("deriveSidebarExpansionState keeps unrelated folders collapsed outside search mode", () => {
  const state = deriveSidebarExpansionState(
    createInput({
      topicId: "topic-2",
      subtopicId: "subtopic-2",
      activeTopicId: "topic-1",
      activeSubtopicId: "subtopic-1",
      activePostId: undefined,
    }),
  );

  assert.equal(state.topicExpanded, false);
  assert.equal(state.subtopicExpanded, false);
});
