import assert from "node:assert/strict";
import test from "node:test";
import { ValidationError } from "@/shared/lib/app-error";
import {
  parseSiteSettingsFormData,
  resolveSiteSettingsInput,
} from "./settings-write";

test("parseSiteSettingsFormData normalizes optional fields and site url", () => {
  const formData = new FormData();
  formData.set("siteTitle", "  My Blog  ");
  formData.set("siteUrl", "https://example.com/");
  formData.set("logoUrl", " https://cdn.example.com/logo.png ");
  formData.set("avatarUrl", " ");
  formData.set("footerText", "  Hello  ");

  assert.deepEqual(parseSiteSettingsFormData(formData), {
    siteTitle: "My Blog",
    siteSubtitle: null,
    siteDescription: null,
    siteUrl: "https://example.com",
    logoUrl: "https://cdn.example.com/logo.png",
    avatarUrl: null,
    githubUrl: null,
    xUrl: null,
    email: null,
    footerText: "Hello",
  });
});

test("parseSiteSettingsFormData falls back to the provided site url", () => {
  const formData = new FormData();
  formData.set("siteTitle", "Blog");

  assert.equal(parseSiteSettingsFormData(formData).siteUrl, null);
});

test("resolveSiteSettingsInput falls back to the provided site url", () => {
  assert.equal(
    resolveSiteSettingsInput(
      {
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
      },
      {
        fallbackSiteUrl: "https://fallback.example.com/",
      },
    ).siteUrl,
    "https://fallback.example.com",
  );
});

test("parseSiteSettingsFormData rejects invalid urls", () => {
  const formData = new FormData();
  formData.set("siteTitle", "Blog");
  formData.set("logoUrl", "/logo.png");

  assert.throws(() => parseSiteSettingsFormData(formData), ValidationError);
});
