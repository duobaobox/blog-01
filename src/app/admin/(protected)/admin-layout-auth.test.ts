import assert from "node:assert/strict";
import test from "node:test";
import { getAdminShellAuthRedirect } from "./admin-layout-auth";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/app-error";

test("getAdminShellAuthRedirect sends anonymous admin access to login", () => {
  assert.equal(
    getAdminShellAuthRedirect(new UnauthorizedError()),
    "/admin/login",
  );
});

test("getAdminShellAuthRedirect leaves non-auth failures visible", () => {
  assert.equal(getAdminShellAuthRedirect(new ForbiddenError()), null);
  assert.equal(getAdminShellAuthRedirect(new Error("Database failed")), null);
});
