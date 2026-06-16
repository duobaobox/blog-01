import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenError } from "@/shared/lib/app-error";
import {
  isEmailSignUpPath,
  resolveBootstrapSignupEmail,
} from "./bootstrap-signup";

test("isEmailSignUpPath detects the better-auth email sign-up endpoint", () => {
  assert.equal(isEmailSignUpPath("/api/auth/sign-up/email"), true);
  assert.equal(isEmailSignUpPath("/api/auth/sign-in/email"), false);
});

test("resolveBootstrapSignupEmail skips bootstrap guards for non sign-up routes", async () => {
  let emailRead = false;

  const result = await resolveBootstrapSignupEmail({
    pathname: "/api/auth/sign-in/email",
    headers: new Headers(),
    async readEmail() {
      emailRead = true;
      return "owner@example.com";
    },
  });

  assert.equal(result, null);
  assert.equal(emailRead, false);
});

test("resolveBootstrapSignupEmail rejects sign-up when bootstrap is disabled", async () => {
  await assert.rejects(
    () =>
      resolveBootstrapSignupEmail({
        pathname: "/api/auth/sign-up/email",
        headers: new Headers(),
        async readEmail() {
          return "owner@example.com";
        },
        async isBootstrapAllowed() {
          return false;
        },
      }),
    (error: unknown) =>
      error instanceof ForbiddenError &&
      error.message === "Sign-up is disabled.",
  );
});

test("resolveBootstrapSignupEmail rejects invalid bootstrap token", async () => {
  await assert.rejects(
    () =>
      resolveBootstrapSignupEmail({
        pathname: "/api/auth/sign-up/email",
        headers: new Headers(),
        async readEmail() {
          return "owner@example.com";
        },
        async isBootstrapAllowed() {
          return true;
        },
        configuredToken: "secret-token",
        nodeEnv: "production",
      }),
    (error: unknown) =>
      error instanceof ForbiddenError &&
      error.message === "Invalid admin setup token.",
  );
});

test("resolveBootstrapSignupEmail rejects sign-up during development default-admin mode", async () => {
  await assert.rejects(
    () =>
      resolveBootstrapSignupEmail({
        pathname: "/api/auth/sign-up/email",
        headers: new Headers(),
        async readEmail() {
          return "owner@example.com";
        },
        async isBootstrapAllowed() {
          return true;
        },
        configuredToken: "",
        nodeEnv: "development",
      }),
    (error: unknown) =>
      error instanceof ForbiddenError &&
      error.message === "Sign-up is disabled.",
  );
});

test("resolveBootstrapSignupEmail returns the parsed email when bootstrap is allowed", async () => {
  const result = await resolveBootstrapSignupEmail({
    pathname: "/api/auth/sign-up/email",
    headers: new Headers({
      "x-admin-setup-token": "secret-token",
    }),
    async readEmail() {
      return "owner@example.com";
    },
    async isBootstrapAllowed() {
      return true;
    },
    configuredToken: "secret-token",
    nodeEnv: "production",
  });

  assert.equal(result, "owner@example.com");
});
