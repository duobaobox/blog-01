import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";
import {
  normalizeOptionalString,
  requireTrimmedString,
  validateOptionalHttpUrl,
  validateOptionalSiteResourceUrl,
} from "@/shared/lib/validation";

export type SiteSettingsWriteInput = {
  siteTitle: string;
  siteDescription: string | null;
  siteUrl: string | null;
  logoUrl: string | null;
  email: string | null;
  footerText: string | null;
};

export type SiteSettingsInput = {
  siteTitle: string;
  siteDescription: string | null;
  siteUrl: string;
  logoUrl: string | null;
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
  const logoUrl = normalizeOptionalString(formData.get("logoUrl"));

  validateOptionalHttpUrl(
    siteUrl,
    "站点 URL 格式不正确，请填写完整的 http/https 地址",
  );
  validateOptionalSiteResourceUrl(
    logoUrl,
    "Logo 地址格式不正确，请填写以 / 开头的站内路径，或完整的 http/https 地址",
  );

  return {
    siteTitle,
    siteDescription: normalizeOptionalString(formData.get("siteDescription")),
    siteUrl: siteUrl ? normalizeSiteUrl(siteUrl) : null,
    logoUrl,
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
