import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSpaceQueryPlan } from "./content-space-query-plan";

test("content space query plan keeps quick-entry views lean", () => {
  assert.deepEqual(
    buildContentSpaceQueryPlan({
      query: "",
      requestedEntry: "drafts",
      requestedPostId: "post-1",
    }),
    {
      pageTarget: "library",
      shouldLoadSearchResults: false,
      shouldLoadRequestedPostForContext: false,
      shouldLoadFolderPostsFromExplicitFolder: false,
    },
  );
});

test("content space query plan loads search results only when query exists", () => {
  assert.deepEqual(
    buildContentSpaceQueryPlan({
      query: " growth ",
      requestedEntry: "library",
      requestedFolderId: "folder-1",
      requestedPostId: "post-1",
    }),
    {
      pageTarget: "library",
      shouldLoadSearchResults: true,
      shouldLoadRequestedPostForContext: false,
      shouldLoadFolderPostsFromExplicitFolder: false,
    },
  );
});

test("content space query plan loads requested post only for implicit folder-context recovery", () => {
  assert.deepEqual(
    buildContentSpaceQueryPlan({
      query: "",
      requestedEntry: undefined,
      requestedPostId: "post-9",
    }),
    {
      pageTarget: "library",
      shouldLoadSearchResults: false,
      shouldLoadRequestedPostForContext: true,
      shouldLoadFolderPostsFromExplicitFolder: false,
    },
  );
});

test("content space query plan loads folder posts for explicit folder context", () => {
  assert.deepEqual(
    buildContentSpaceQueryPlan({
      query: "",
      requestedEntry: "folder",
      requestedFolderId: "folder-2",
    }),
    {
      pageTarget: "library",
      shouldLoadSearchResults: false,
      shouldLoadRequestedPostForContext: false,
      shouldLoadFolderPostsFromExplicitFolder: true,
    },
  );
});
