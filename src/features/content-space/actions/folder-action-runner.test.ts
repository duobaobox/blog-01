import assert from "node:assert/strict";
import test from "node:test";
import { createFolderActionRunner } from "./folder-action-runner";

test("folder action runner creates folders before refreshing admin posts", async () => {
  const calls: string[] = [];
  const runner = createFolderActionRunner({
    folderService: {
      async createFolder() {
        calls.push("service:create");
        return {
          id: "folder-1",
          name: "Content System",
          slug: "content-system",
        };
      },
      async renameFolder() {
        throw new Error("not used");
      },
      async deleteFolder() {
        throw new Error("not used");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
  });

  const result = await runner.createFolder({
    name: "Content System",
    description: null,
  });

  assert.deepEqual(calls, ["service:create", "cache:admin"]);
  assert.deepEqual(result, {
    id: "folder-1",
    name: "Content System",
    slug: "content-system",
  });
});

test("folder action runner deletes folders before refreshing admin posts", async () => {
  const calls: string[] = [];
  const runner = createFolderActionRunner({
    folderService: {
      async createFolder() {
        throw new Error("not used");
      },
      async renameFolder() {
        throw new Error("not used");
      },
      async deleteFolder() {
        calls.push("service:delete");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
  });

  await runner.deleteFolder("folder-1");

  assert.deepEqual(calls, ["service:delete", "cache:admin"]);
});
