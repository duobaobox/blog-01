import assert from "node:assert/strict";
import test from "node:test";
import { createSavedContentViewActionRunner } from "./content-space-saved-view-action-runner";

test("saved view action runner stores views before refreshing admin posts", async () => {
  const calls: string[] = [];
  const runner = createSavedContentViewActionRunner({
    savedViewService: {
      async saveSavedContentView() {
        calls.push("service:save");
        return {
          id: "view-1",
          name: "待补 SEO",
          filters: {
            debt: "missingSeoTitle",
          },
          createdAt: "2026-06-15T10:00:00.000Z",
        };
      },
      async deleteSavedContentView() {
        throw new Error("not used");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
  });

  const result = await runner.saveSavedContentView({
    userId: "admin-1",
    name: "待补 SEO",
    filters: {
      debt: "missingSeoTitle",
    },
  });

  assert.deepEqual(calls, ["service:save", "cache:admin"]);
  assert.equal(result.id, "view-1");
  assert.equal(result.name, "待补 SEO");
});

test("saved view action runner deletes views before refreshing admin posts", async () => {
  const calls: string[] = [];
  const runner = createSavedContentViewActionRunner({
    savedViewService: {
      async saveSavedContentView() {
        throw new Error("not used");
      },
      async deleteSavedContentView() {
        calls.push("service:delete");
      },
    },
    revalidateAdminPosts() {
      calls.push("cache:admin");
    },
  });

  await runner.deleteSavedContentView({
    userId: "admin-1",
    viewId: "view-1",
  });

  assert.deepEqual(calls, ["service:delete", "cache:admin"]);
});
