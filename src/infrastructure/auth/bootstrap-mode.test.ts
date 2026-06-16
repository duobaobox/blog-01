import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAdminBootstrapMode,
  shouldAllowDefaultAdminLoginHint,
} from "./bootstrap-mode";

test("resolveAdminBootstrapMode closes initialization after the first user exists", () => {
  assert.deepEqual(
    resolveAdminBootstrapMode({
      bootstrapAllowed: false,
      nodeEnv: "development",
    }),
    {
      kind: "closed",
      canInitialize: false,
      usesDefaultAdmin: false,
      requiresSetupToken: false,
      showsDefaultAdminLoginHint: false,
    },
  );
});

test("resolveAdminBootstrapMode uses development default admin only without setup token", () => {
  assert.deepEqual(
    resolveAdminBootstrapMode({
      bootstrapAllowed: true,
      nodeEnv: "development",
      configuredToken: "",
    }),
    {
      kind: "development-default-admin",
      canInitialize: true,
      usesDefaultAdmin: true,
      requiresSetupToken: false,
      showsDefaultAdminLoginHint: true,
    },
  );
});

test("resolveAdminBootstrapMode uses manual signup in production or when a token is configured", () => {
  assert.deepEqual(
    resolveAdminBootstrapMode({
      bootstrapAllowed: true,
      nodeEnv: "production",
      configuredToken: "",
    }),
    {
      kind: "manual-admin-signup",
      canInitialize: true,
      usesDefaultAdmin: false,
      requiresSetupToken: false,
      showsDefaultAdminLoginHint: false,
    },
  );

  assert.deepEqual(
    resolveAdminBootstrapMode({
      bootstrapAllowed: true,
      nodeEnv: "development",
      configuredToken: "setup-secret",
    }),
    {
      kind: "manual-admin-signup",
      canInitialize: true,
      usesDefaultAdmin: false,
      requiresSetupToken: true,
      showsDefaultAdminLoginHint: false,
    },
  );
});

test("shouldAllowDefaultAdminLoginHint only allows local convenience mode", () => {
  assert.equal(shouldAllowDefaultAdminLoginHint({ nodeEnv: "development" }), true);
  assert.equal(shouldAllowDefaultAdminLoginHint({ nodeEnv: "production" }), false);
  assert.equal(
    shouldAllowDefaultAdminLoginHint({
      nodeEnv: "development",
      configuredToken: "setup-secret",
    }),
    false,
  );
});
