import assert from "node:assert/strict";
import test from "node:test";
import {
  getTopicRowActionModel,
  getSubtopicRowActionModel,
} from "./content-space-node-actions";

test("getTopicRowActionModel separates select and expand actions", () => {
  const model = getTopicRowActionModel({
    expanded: true,
    active: false,
    subtopicCount: 3,
  });

  assert.equal(model.toggleLabel, "收起专题");
  assert.equal(model.selectLabel, "进入专题");
  assert.equal(model.badgeText, "3");
});

test("getSubtopicRowActionModel reflects hidden post count", () => {
  const model = getSubtopicRowActionModel({
    expanded: false,
    active: true,
    postCount: 9,
    hiddenPostCount: 4,
  });

  assert.equal(model.toggleLabel, "展开子专题");
  assert.equal(model.selectLabel, "进入子专题");
  assert.equal(model.helperText, "还有 4 篇");
});
