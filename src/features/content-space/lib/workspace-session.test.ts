import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWorkspaceSessionRestoreParams,
  deserializeWorkspaceSession,
  serializeWorkspaceSession,
  shouldPersistWorkspaceSessionToServer,
  type WorkspaceSession,
} from "./workspace-session";

test("serializeWorkspaceSession writes a stable versioned JSON payload", () => {
  const session: WorkspaceSession = {
    activeEntry: "folder",
    folderId: "folder-2",
    postId: "post-9",
  };

  assert.equal(
    serializeWorkspaceSession(session),
    JSON.stringify({
      version: 2,
      session,
    }),
  );
});

test("deserializeWorkspaceSession restores a versioned workspace session", () => {
  const raw = serializeWorkspaceSession({
    activeEntry: "search",
    folderId: "folder-2",
    postId: "post-3",
    searchQuery: "docker",
  });

  assert.deepEqual(deserializeWorkspaceSession(raw), {
    activeEntry: "search",
    folderId: "folder-2",
    postId: "post-3",
    searchQuery: "docker",
  });
});

test("deserializeWorkspaceSession keeps compatibility with legacy workspace payloads", () => {
  const raw = JSON.stringify({
    activeEntry: "library",
    postId: "post-3",
  });

  assert.deepEqual(deserializeWorkspaceSession(raw), {
    activeEntry: "library",
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
    deserializeWorkspaceSession(JSON.stringify({ activeEntry: "folder", folderId: 123 })),
    null,
  );
  assert.equal(
    deserializeWorkspaceSession(JSON.stringify({ version: 2, session: { activeEntry: "library", page: 0 } })),
    null,
  );
});

test("buildWorkspaceSessionRestoreParams restores search, folder, and filtered library state", () => {
  assert.deepEqual(
    buildWorkspaceSessionRestoreParams({
      activeEntry: "search",
      folderId: "folder-2",
      postId: "post-3",
      searchQuery: "docker",
    }),
    {
      view: "edit",
      entry: "search",
      q: "docker",
      folderId: "folder-2",
      postId: "post-3",
    },
  );

  assert.deepEqual(
    buildWorkspaceSessionRestoreParams({
      activeEntry: "post",
      folderId: "folder-1",
      postId: "post-1",
    }),
    {
      view: "edit",
      entry: "folder",
      folderId: "folder-1",
      postId: "post-1",
    },
  );

  assert.deepEqual(
    buildWorkspaceSessionRestoreParams({
      activeEntry: "library",
      page: 2,
      filters: {
        status: "draft",
      },
    }),
    {
      view: "edit",
      entry: "library",
      page: 2,
      filters: {
        status: "draft",
      },
    },
  );
});

test("shouldPersistWorkspaceSessionToServer identifies non-default recovery state", () => {
  assert.equal(shouldPersistWorkspaceSessionToServer({ activeEntry: "library" }), false);
  assert.equal(
    shouldPersistWorkspaceSessionToServer({
      activeEntry: "library",
      filters: {
        status: "draft",
      },
    }),
    true,
  );
  assert.equal(
    shouldPersistWorkspaceSessionToServer({
      activeEntry: "search",
      searchQuery: "release",
    }),
    true,
  );
});
