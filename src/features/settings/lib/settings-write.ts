import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";
import {
  normalizeOptionalString,
  requireTrimmedString,
  validateOptionalHttpUrl,
  validateOptionalRenderableImageUrl,
  validateOptionalSiteResourceUrl,
} from "@/shared/lib/validation";

export type SiteSettingsWriteInput = {
  siteTitle: string;
  siteDescription: string | null;
  siteUrl: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  email: string | null;
  footerText: string | null;
};

export type SiteSettingsInput = {
  siteTitle: string;
  siteDescription: string | null;
  siteUrl: string;
  logoUrl: string | null;
  faviconUrl: string | null;
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
  const faviconUrl = normalizeOptionalString(formData.get("faviconUrl"));

  validateOptionalHttpUrl(
    siteUrl,
    "站点 URL 格式不正确，请填写完整的 http/https 地址",
  );
  // Logo 和封面一样交给 next/image 渲染，next/image 未配置的主机会在渲染时抛错
  // 并让页头整块 500，所以按“可渲染”范围收窄。favicon 由浏览器直接请求，
  // 不经过图片优化器，仍按普通站点资源地址校验。
  validateOptionalRenderableImageUrl(
    logoUrl,
    "Logo 地址不可用，请填写本站 /media 路径或已配置的对象存储地址",
  );
  validateOptionalSiteResourceUrl(
    faviconUrl,
    "标签图标地址格式不正确，请填写以 / 开头的站内路径，或完整的 http/https 地址",
  );

  return {
    siteTitle,
    siteDescription: normalizeOptionalString(formData.get("siteDescription")),
    siteUrl: siteUrl ? normalizeSiteUrl(siteUrl) : null,
    logoUrl,
    faviconUrl,
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
