import assert from "node:assert/strict";
import test from "node:test";
import { needsSiteBasicSetupFromTitle } from "./site-setup";

test("needsSiteBasicSetupFromTitle treats missing title as setup incomplete", () => {
  assert.equal(needsSiteBasicSetupFromTitle(null), true);
  assert.equal(needsSiteBasicSetupFromTitle(undefined), true);
});

test("needsSiteBasicSetupFromTitle detects untouched default site title", () => {
  assert.equal(needsSiteBasicSetupFromTitle("My Blog"), true);
  assert.equal(needsSiteBasicSetupFromTitle("  My Blog  "), true);
});

test("needsSiteBasicSetupFromTitle accepts customized title", () => {
  assert.equal(needsSiteBasicSetupFromTitle("Duobao Notes"), false);
});
