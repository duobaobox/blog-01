import assert from "node:assert/strict";
import test from "node:test";
import {
  deserializeWorkspaceSession,
  serializeWorkspaceSession,
  type WorkspaceSession,
} from "./workspace-session";

test("serializeWorkspaceSession writes a stable JSON payload", () => {
  const session: WorkspaceSession = {
    activeEntry: "subtopic",
    topicId: "topic-1",
    subtopicId: "subtopic-2",
    postId: "post-9",
  };

  assert.equal(
    serializeWorkspaceSession(session),
    JSON.stringify(session),
  );
});

test("deserializeWorkspaceSession restores a valid workspace session", () => {
  const raw = JSON.stringify({
    activeEntry: "drafts",
    postId: "post-3",
  });

  assert.deepEqual(deserializeWorkspaceSession(raw), {
    activeEntry: "drafts",
    postId: "post-3",
  });
});

test("deserializeWorkspaceSession returns null for invalid payloads", () => {
  assert.equal(deserializeWorkspaceSession(""), null);
  assert.equal(deserializeWorkspaceSession("{"), null);
  assert.equal(
    deserializeWorkspaceSession(JSON.stringify({ activeEntry: "invalid" })),
    null,
  );
  assert.equal(
    deserializeWorkspaceSession(JSON.stringify({ activeEntry: "topic", topicId: 123 })),
    null,
  );
});
