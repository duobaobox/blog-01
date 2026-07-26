import assert from "node:assert/strict";
import test from "node:test";
import { createSettingsActionRunner } from "./settings-action-runner";

test("settings action runner updates settings and refreshes admin/public surfaces", async () => {
  const calls: string[] = [];
  const runner = createSettingsActionRunner({
    settingsService: {
      async updateSiteSettings() {
        calls.push("service:update");
      },
    },
    revalidateAdminSettings() {
      calls.push("cache:admin");
    },
    revalidatePublicSite() {
      calls.push("cache:public");
    },
  });

  await runner.updateSiteSettings({
    siteTitle: "Blog",
    siteDescription: null,
    siteUrl: "https://example.com",
    logoUrl: null,
    faviconUrl: null,
    email: null,
    footerText: null,
  });

  assert.deepEqual(calls, [
    "service:update",
    "cache:admin",
    "cache:public",
  ]);
});
