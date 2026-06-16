import assert from "node:assert/strict";
import test from "node:test";
import { createAccountActionRunner } from "./account-action-runner";

test("account action runner updates profile before refreshing admin account surfaces", async () => {
  const calls: string[] = [];
  const runner = createAccountActionRunner({
    settingsService: {
      async updateAdminProfile() {
        calls.push("service:update");
        return {
          name: "Duobao",
        };
      },
    },
    revalidateAdminAccount() {
      calls.push("cache:admin");
    },
  });

  const result = await runner.updateAdminProfile({
    userId: "user-1",
    name: "Duobao",
  });

  assert.deepEqual(calls, ["service:update", "cache:admin"]);
  assert.deepEqual(result, {
    name: "Duobao",
  });
});
