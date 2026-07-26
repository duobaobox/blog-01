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
  formData.set("logoUrl", " /media/logo.png ");
  formData.set("footerText", "  Hello  ");

  assert.deepEqual(parseSiteSettingsFormData(formData), {
    siteTitle: "My Blog",
    siteDescription: null,
    siteUrl: "https://example.com",
    logoUrl: "/media/logo.png",
    email: null,
    footerText: "Hello",
  });
});

test("parseSiteSettingsFormData accepts absolute external logo urls", () => {
  const formData = new FormData();
  formData.set("siteTitle", "Blog");
  formData.set("logoUrl", "https://cdn.example.com/logo.png");

  assert.equal(
    parseSiteSettingsFormData(formData).logoUrl,
    "https://cdn.example.com/logo.png",
  );
});

test("parseSiteSettingsFormData leaves an omitted site url unresolved", () => {
  const formData = new FormData();
  formData.set("siteTitle", "Blog");

  assert.equal(parseSiteSettingsFormData(formData).siteUrl, null);
});

test("resolveSiteSettingsInput falls back to the provided site url", () => {
  assert.equal(
    resolveSiteSettingsInput(
      {
        siteTitle: "Blog",
        siteDescription: null,
        siteUrl: null,
        logoUrl: null,
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

test("parseSiteSettingsFormData rejects unsafe or incomplete logo urls", () => {
  for (const logoUrl of ["media/logo.png", "//cdn.example.com/logo.png", "ftp://example.com/logo.png"]) {
    const formData = new FormData();
    formData.set("siteTitle", "Blog");
    formData.set("logoUrl", logoUrl);

    assert.throws(() => parseSiteSettingsFormData(formData), ValidationError);
  }
});
