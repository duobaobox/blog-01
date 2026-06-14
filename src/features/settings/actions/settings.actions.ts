"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as settingsRepo from "@/features/settings/repositories/settings.repository";
import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateSiteSettings(formData: FormData) {
  await requireAdminSession();

  const siteTitle = (formData.get("siteTitle") as string)?.trim();
  const siteUrl = (formData.get("siteUrl") as string)?.trim();
  const existingSettings = await settingsRepo.findSiteSettings();

  if (!siteTitle) throw new Error("站点名称不能为空");
  if (siteUrl && !isValidUrl(siteUrl))
    throw new Error("站点 URL 格式不正确，请填写完整的 http/https 地址");
  const normalizedSiteUrl = normalizeSiteUrl(
    siteUrl || existingSettings?.siteUrl || siteConfig.url,
  );

  const urlFields = [
    ["logoUrl", "Logo"],
    ["avatarUrl", "头像"],
    ["githubUrl", "GitHub"],
    ["xUrl", "X (Twitter)"],
  ] as const;
  for (const [field, label] of urlFields) {
    const val = (formData.get(field) as string)?.trim();
    if (val && !isValidUrl(val))
      throw new Error(`${label} URL 格式不正确，请填写完整的 http/https 地址`);
  }

  await settingsRepo.upsertSiteSettings({
    siteTitle,
    siteSubtitle: (formData.get("siteSubtitle") as string)?.trim() || null,
    siteDescription:
      (formData.get("siteDescription") as string)?.trim() || null,
    siteUrl: normalizedSiteUrl,
    logoUrl: (formData.get("logoUrl") as string)?.trim() || null,
    avatarUrl: (formData.get("avatarUrl") as string)?.trim() || null,
    githubUrl: (formData.get("githubUrl") as string)?.trim() || null,
    xUrl: (formData.get("xUrl") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    footerText: (formData.get("footerText") as string)?.trim() || null,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
