import assert from "node:assert/strict";
import test from "node:test";
import {
  getPostAutosaveDelay,
  POST_AUTOSAVE_IDLE_MS,
  POST_AUTOSAVE_MAX_WAIT_MS,
} from "./post-autosave";

test("autosave waits for an idle editing window", () => {
  assert.equal(
    getPostAutosaveDelay({
      now: 10_000,
      maxWaitDeadline: 10_000 + POST_AUTOSAVE_MAX_WAIT_MS,
    }),
    POST_AUTOSAVE_IDLE_MS,
  );
});

test("autosave respects the maximum unsaved duration", () => {
  assert.equal(
    getPostAutosaveDelay({
      now: 39_000,
      maxWaitDeadline: 40_000,
    }),
    1_000,
  );
});

test("autosave runs immediately after the maximum wait expires", () => {
  assert.equal(
    getPostAutosaveDelay({
      now: 40_000,
      maxWaitDeadline: 39_000,
    }),
    0,
  );
});
