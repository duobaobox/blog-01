import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDeleteMediaWorkflow,
  buildReplaceMediaWorkflow,
  buildUpdateMediaAltWorkflow,
  buildUploadMediaWorkflow,
} from "./media-action-workflow";

test("media upload/delete/update workflows refresh the admin media surface", () => {
  assert.deepEqual(buildUploadMediaWorkflow(), {
    adminPaths: ["/admin/media"],
  });
  assert.deepEqual(buildDeleteMediaWorkflow(), {
    adminPaths: ["/admin/media"],
  });
  assert.deepEqual(buildUpdateMediaAltWorkflow(), {
    adminPaths: ["/admin/media"],
  });
});

test("media replace workflow refreshes both media and post admin surfaces", () => {
  assert.deepEqual(buildReplaceMediaWorkflow(), {
    adminPaths: ["/admin/media", "/admin/posts"],
  });
});
