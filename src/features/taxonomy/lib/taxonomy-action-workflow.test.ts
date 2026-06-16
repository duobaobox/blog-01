import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateCategoryWorkflow,
  buildCreateTagWorkflow,
  buildDeleteCategoryWorkflow,
  buildDeleteTagWorkflow,
  buildUpdateCategoryWorkflow,
  buildUpdateTagWorkflow,
} from "./taxonomy-action-workflow";

test("category workflows always refresh admin and preserve the relevant slug", () => {
  assert.deepEqual(buildCreateCategoryWorkflow("design"), {
    shouldRevalidateAdmin: true,
    publicSlugs: ["design"],
  });
  assert.deepEqual(buildUpdateCategoryWorkflow("growth"), {
    shouldRevalidateAdmin: true,
    publicSlugs: ["growth"],
  });
  assert.deepEqual(buildDeleteCategoryWorkflow("notes"), {
    shouldRevalidateAdmin: true,
    publicSlugs: ["notes"],
  });
});

test("tag workflows always refresh admin and preserve the relevant slug", () => {
  assert.deepEqual(buildCreateTagWorkflow("react"), {
    shouldRevalidateAdmin: true,
    publicSlugs: ["react"],
  });
  assert.deepEqual(buildUpdateTagWorkflow("nextjs"), {
    shouldRevalidateAdmin: true,
    publicSlugs: ["nextjs"],
  });
  assert.deepEqual(buildDeleteTagWorkflow("productivity"), {
    shouldRevalidateAdmin: true,
    publicSlugs: ["productivity"],
  });
});
