import assert from "node:assert/strict";
import test from "node:test";
import { buildUpdateSiteSettingsWorkflow } from "./settings-action-workflow";

test("buildUpdateSiteSettingsWorkflow refreshes both admin and public site surfaces", () => {
  assert.deepEqual(buildUpdateSiteSettingsWorkflow(), {
    revalidateAdminSettings: true,
    revalidatePublicSite: true,
  });
});
