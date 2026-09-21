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
  formData.set("faviconUrl", " /media/favicon.png ");
  formData.set("footerText", "  Hello  ");

  assert.deepEqual(parseSiteSettingsFormData(formData), {
    siteTitle: "My Blog",
    siteDescription: null,
    siteUrl: "https://example.com",
    logoUrl: "/media/logo.png",
    faviconUrl: "/media/favicon.png",
    email: null,
    footerText: "Hello",
  });
});

test("parseSiteSettingsFormData 接受已配置对象存储的 Logo 地址", () => {
  const formData = new FormData();
  formData.set("siteTitle", "Blog");
  formData.set(
    "logoUrl",
    "https://store.public.blob.vercel-storage.com/logo.png",
  );

  assert.equal(
    parseSiteSettingsFormData(formData).logoUrl,
    "https://store.public.blob.vercel-storage.com/logo.png",
  );
});

test("parseSiteSettingsFormData 拒绝 next/image 渲染不了的外部 Logo", () => {
  // Logo 走 next/image，未配置的主机会在渲染时抛错并让页头整块 500，
  // 所以这类地址必须在写入时就被拦住，而不是等页面崩掉。
  const formData = new FormData();
  formData.set("siteTitle", "Blog");
  formData.set("logoUrl", "https://cdn.example.com/logo.png");

  assert.throws(() => parseSiteSettingsFormData(formData), ValidationError);
});

test("parseSiteSettingsFormData 仍接受外部 favicon（由浏览器直接请求）", () => {
  const formData = new FormData();
  formData.set("siteTitle", "Blog");
  formData.set("faviconUrl", "https://cdn.example.com/favicon.png");

  assert.equal(
    parseSiteSettingsFormData(formData).faviconUrl,
    "https://cdn.example.com/favicon.png",
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
        faviconUrl: null,
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
  for (const logoUrl of [
    "media/logo.png",
    "//cdn.example.com/logo.png",
    "ftp://example.com/logo.png",
  ]) {
    const formData = new FormData();
    formData.set("siteTitle", "Blog");
    formData.set("logoUrl", logoUrl);

    assert.throws(() => parseSiteSettingsFormData(formData), ValidationError);
  }

  const formData = new FormData();
  formData.set("siteTitle", "Blog");
  formData.set("faviconUrl", "favicon.png");
  assert.throws(() => parseSiteSettingsFormData(formData), ValidationError);
});
