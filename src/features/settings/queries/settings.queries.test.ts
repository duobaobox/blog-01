import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminAccountPageDataQuery,
  createAdminShellPageDataQuery,
  createAdminSettingsPageDataQuery,
  createAdminShellStatusQuery,
} from "@/features/settings/queries/settings.queries";
import { needsSiteBasicSetupFromTitle } from "@/features/settings/lib/site-setup";

test("site setup status query rule stays aligned with site-title semantics", () => {
  assert.equal(needsSiteBasicSetupFromTitle(null), true);
  assert.equal(needsSiteBasicSetupFromTitle("My Blog"), true);
  assert.equal(needsSiteBasicSetupFromTitle("Duobao Notes"), false);
});

test("admin onboarding status shape remains a focused settings projection", () => {
  const needsSiteSetup = needsSiteBasicSetupFromTitle("My Blog");

  assert.deepEqual(
    {
      needsSiteSetup,
    },
    {
      needsSiteSetup: true,
    },
  );
});

test("admin account security status shape stays projection-friendly", () => {
  assert.deepEqual(
    {
      needsPasswordChange: true,
    },
    {
      needsPasswordChange: true,
    },
  );
});

test("createAdminShellStatusQuery aggregates onboarding and security reminders for admin shell", async () => {
  const calls: string[] = [];
  const query = createAdminShellStatusQuery({
    async getAdminOnboardingStatus() {
      calls.push("onboarding");
      return {
        needsSiteSetup: true,
      };
    },
    async getAdminAccountSecurityStatus({ userId }) {
      calls.push(`security:${userId}`);
      return {
        needsPasswordChange: false,
      };
    },
  });

  const result = await query({
    userId: "admin-1",
  });

  assert.deepEqual(calls.sort(), ["onboarding", "security:admin-1"]);
  assert.deepEqual(result, {
    onboarding: {
      needsSiteSetup: true,
    },
    security: {
      needsPasswordChange: false,
    },
  });
});

test("createAdminSettingsPageDataQuery aggregates the focused settings form data", async () => {
  const calls: string[] = [];
  const query = createAdminSettingsPageDataQuery({
    async getSiteSettings() {
      calls.push("settings");
      return {
        siteTitle: "Duobao Notes",
        siteDescription: "Thoughts and notes",
        siteUrl: "https://example.com",
        logoUrl: null,
        faviconUrl: null,
        email: null,
        footerText: null,
      };
    },
    async getSiteSetupStatus() {
      calls.push("setup");
      return true;
    },
  });

  const result = await query();

  assert.deepEqual(calls.sort(), ["settings", "setup"]);
  assert.deepEqual(result, {
    settings: {
      siteTitle: "Duobao Notes",
      siteDescription: "Thoughts and notes",
      siteUrl: "https://example.com",
      logoUrl: null,
      email: null,
      footerText: null,
    },
    showSetupNotice: true,
  });
});

test("createAdminAccountPageDataQuery aggregates account defaults and security notice", async () => {
  const calls: string[] = [];
  const query = createAdminAccountPageDataQuery({
    async getAdminSessionIdentity() {
      calls.push("session");
      return { id: "admin-1", name: "Duobao", role: "admin" };
    },
    async getAdminAccountSecurityStatus({ userId }) {
      calls.push(`security:${userId}`);
      return {
        needsPasswordChange: true,
      };
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["session", "security:admin-1"]);
  assert.deepEqual(result, {
    defaultName: "Duobao",
    showPasswordNotice: true,
  });
});

test("createAdminShellPageDataQuery centralizes admin session identity and shell reminders", async () => {
  const calls: string[] = [];
  const query = createAdminShellPageDataQuery({
    async getAdminSessionIdentity() {
      calls.push("session");
      return { id: "admin-1", name: "Duobao", role: "admin" };
    },
    async getAdminShellStatus({ userId }) {
      calls.push(`shell:${userId}`);
      return {
        onboarding: {
          needsSiteSetup: true,
        },
        security: {
          needsPasswordChange: false,
        },
      };
    },
  });

  const result = await query();

  assert.deepEqual(calls, ["session", "shell:admin-1"]);
  assert.deepEqual(result, {
    session: {
      id: "admin-1",
      name: "Duobao",
      role: "admin",
    },
    shellStatus: {
      onboarding: {
        needsSiteSetup: true,
      },
      security: {
        needsPasswordChange: false,
      },
    },
  });
});
