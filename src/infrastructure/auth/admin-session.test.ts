import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSessionIdentityQuery,
  toAdminSessionIdentity,
} from "./admin-session";

test("toAdminSessionIdentity narrows admin session data to the minimal page-facing identity", () => {
  const result = toAdminSessionIdentity({
    user: {
      id: "admin-1",
      name: "Duobao",
      role: "admin",
      email: "admin@example.com",
      username: "admin",
    },
  } as never);

  assert.deepEqual(result, {
    id: "admin-1",
    name: "Duobao",
    role: "admin",
  });
});

test("createAdminSessionIdentityQuery reuses requireAdminSession and returns a stable identity shape", async () => {
  const calls: string[] = [];
  const query = createAdminSessionIdentityQuery({
    async requireAdminSession() {
      calls.push("session");
      return {
        user: {
          id: "admin-1",
          name: "Duobao",
          role: "admin",
        },
      } as never;
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["session"]);
  assert.deepEqual(result, {
    id: "admin-1",
    name: "Duobao",
    role: "admin",
  });
});
