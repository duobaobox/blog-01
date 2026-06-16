import assert from "node:assert/strict";
import test from "node:test";
import { createUpdateSiteSettingsService } from "./settings.service";

test("updateSiteSettings falls back to the persisted site url when the form omits one", async () => {
  const calls: Array<{
    type: string;
    data?: unknown;
  }> = [];
  const updateSiteSettings = createUpdateSiteSettingsService({
    async findSiteSettings() {
      calls.push({ type: "repo:find" });
      return {
        id: "settings-1",
        siteTitle: "Existing",
        siteSubtitle: null,
        siteDescription: null,
        siteUrl: "https://persisted.example.com/",
        logoUrl: null,
        avatarUrl: null,
        githubUrl: null,
        xUrl: null,
        email: null,
        footerText: null,
      };
    },
    async upsertSiteSettings(data) {
      calls.push({ type: "repo:upsert", data });
    },
  });

  await updateSiteSettings({
    siteTitle: "Blog",
    siteSubtitle: null,
    siteDescription: null,
    siteUrl: null,
    logoUrl: null,
    avatarUrl: null,
    githubUrl: null,
    xUrl: null,
    email: null,
    footerText: null,
  });

  assert.deepEqual(calls, [
    { type: "repo:find" },
    {
      type: "repo:upsert",
      data: {
        siteTitle: "Blog",
        siteSubtitle: null,
        siteDescription: null,
        siteUrl: "https://persisted.example.com",
        logoUrl: null,
        avatarUrl: null,
        githubUrl: null,
        xUrl: null,
        email: null,
        footerText: null,
      },
    },
  ]);
});

test("updateSiteSettings preserves the submitted site url when present", async () => {
  let persistedInput: unknown;
  const updateSiteSettings = createUpdateSiteSettingsService({
    async findSiteSettings() {
      return null;
    },
    async upsertSiteSettings(data) {
      persistedInput = data;
    },
  });

  await updateSiteSettings({
    siteTitle: "Blog",
    siteSubtitle: null,
    siteDescription: null,
    siteUrl: "https://submitted.example.com/",
    logoUrl: null,
    avatarUrl: null,
    githubUrl: null,
    xUrl: null,
    email: null,
    footerText: null,
  });

  assert.deepEqual(persistedInput, {
    siteTitle: "Blog",
    siteSubtitle: null,
    siteDescription: null,
    siteUrl: "https://submitted.example.com",
    logoUrl: null,
    avatarUrl: null,
    githubUrl: null,
    xUrl: null,
    email: null,
    footerText: null,
  });
});
