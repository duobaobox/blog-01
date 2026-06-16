import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";
import {
  normalizeOptionalString,
  requireTrimmedString,
  validateOptionalHttpUrl,
} from "@/shared/lib/validation";

export type SiteSettingsWriteInput = {
  siteTitle: string;
  siteSubtitle: string | null;
  siteDescription: string | null;
  siteUrl: string | null;
  logoUrl: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
  xUrl: string | null;
  email: string | null;
  footerText: string | null;
};

export type SiteSettingsInput = {
  siteTitle: string;
  siteSubtitle: string | null;
  siteDescription: string | null;
  siteUrl: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
  xUrl: string | null;
  email: string | null;
  footerText: string | null;
};

export function parseSiteSettingsFormData(
  formData: FormData,
): SiteSettingsWriteInput {
  const siteTitle = requireTrimmedString(
    formData.get("siteTitle"),
    "站点名称不能为空",
  );
  const siteUrl = normalizeOptionalString(formData.get("siteUrl"));

  validateOptionalHttpUrl(
    siteUrl,
    "站点 URL 格式不正确，请填写完整的 http/https 地址",
  );

  const urlFields = [
    ["logoUrl", "Logo"],
    ["avatarUrl", "头像"],
    ["githubUrl", "GitHub"],
    ["xUrl", "X (Twitter)"],
  ] as const;

  for (const [field, label] of urlFields) {
    validateOptionalHttpUrl(
      normalizeOptionalString(formData.get(field)),
      `${label} URL 格式不正确，请填写完整的 http/https 地址`,
    );
  }

  return {
    siteTitle,
    siteSubtitle: normalizeOptionalString(formData.get("siteSubtitle")),
    siteDescription: normalizeOptionalString(formData.get("siteDescription")),
    siteUrl: siteUrl ? normalizeSiteUrl(siteUrl) : null,
    logoUrl: normalizeOptionalString(formData.get("logoUrl")),
    avatarUrl: normalizeOptionalString(formData.get("avatarUrl")),
    githubUrl: normalizeOptionalString(formData.get("githubUrl")),
    xUrl: normalizeOptionalString(formData.get("xUrl")),
    email: normalizeOptionalString(formData.get("email")),
    footerText: normalizeOptionalString(formData.get("footerText")),
  };
}

export function resolveSiteSettingsInput(
  input: SiteSettingsWriteInput,
  options?: {
    fallbackSiteUrl?: string | null;
  },
): SiteSettingsInput {
  return {
    ...input,
    siteUrl: normalizeSiteUrl(
      input.siteUrl || options?.fallbackSiteUrl || siteConfig.url,
    ),
  };
}
