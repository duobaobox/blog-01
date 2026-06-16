import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldCreateDefaultAdminOnSetup,
  shouldRenderManualAdminSetup,
  shouldRedirectLoginToSetup,
  shouldRunAdminSetup,
} from "./admin-entry";
import type { AdminBootstrapMode } from "./bootstrap-mode";

const closedMode: AdminBootstrapMode = {
  kind: "closed",
  canInitialize: false,
  usesDefaultAdmin: false,
  requiresSetupToken: false,
  showsDefaultAdminLoginHint: false,
};

const developmentDefaultAdminMode: AdminBootstrapMode = {
  kind: "development-default-admin",
  canInitialize: true,
  usesDefaultAdmin: true,
  requiresSetupToken: false,
  showsDefaultAdminLoginHint: true,
};

const manualAdminSignupMode: AdminBootstrapMode = {
  kind: "manual-admin-signup",
  canInitialize: true,
  usesDefaultAdmin: false,
  requiresSetupToken: true,
  showsDefaultAdminLoginHint: false,
};

test("login entry redirects to setup while any initialization mode is open", () => {
  assert.equal(
    shouldRedirectLoginToSetup({
      bootstrapMode: developmentDefaultAdminMode,
    }),
    true,
  );
  assert.equal(
    shouldRedirectLoginToSetup({
      bootstrapMode: manualAdminSignupMode,
    }),
    true,
  );
});

test("login entry stays on login page after bootstrap is closed", () => {
  assert.equal(
    shouldRedirectLoginToSetup({
      bootstrapMode: closedMode,
    }),
    false,
  );
});

test("setup entry runs initialization only while bootstrap mode is open", () => {
  assert.equal(
    shouldRunAdminSetup({
      bootstrapMode: developmentDefaultAdminMode,
    }),
    true,
  );

  assert.equal(
    shouldRunAdminSetup({
      bootstrapMode: closedMode,
    }),
    false,
  );
});

test("setup entry separates development default admin from manual signup", () => {
  assert.equal(
    shouldCreateDefaultAdminOnSetup({
      bootstrapMode: developmentDefaultAdminMode,
    }),
    true,
  );
  assert.equal(
    shouldRenderManualAdminSetup({
      bootstrapMode: developmentDefaultAdminMode,
    }),
    false,
  );

  assert.equal(
    shouldCreateDefaultAdminOnSetup({
      bootstrapMode: manualAdminSignupMode,
    }),
    false,
  );
  assert.equal(
    shouldRenderManualAdminSetup({
      bootstrapMode: manualAdminSignupMode,
    }),
    true,
  );
});
