"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as settingsRepo from "@/features/settings/repositories/settings.repository";
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

  if (!siteTitle) throw new Error("站点名称不能为空");
  if (!siteUrl || !isValidUrl(siteUrl))
    throw new Error("站点 URL 格式不正确，请填写完整的 http/https 地址");
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  const urlFields = ["logoUrl", "avatarUrl", "githubUrl", "xUrl"] as const;
  for (const field of urlFields) {
    const val = (formData.get(field) as string)?.trim();
    if (val && !isValidUrl(val))
      throw new Error(`${field} 格式不正确，请填写完整的 http/https 地址`);
  }

  await settingsRepo.upsertSiteSettings({
    siteTitle,
    siteSubtitle: (formData.get("siteSubtitle") as string) || null,
    siteDescription: (formData.get("siteDescription") as string) || null,
    siteUrl: normalizedSiteUrl,
    logoUrl: (formData.get("logoUrl") as string) || null,
    avatarUrl: (formData.get("avatarUrl") as string) || null,
    githubUrl: (formData.get("githubUrl") as string) || null,
    xUrl: (formData.get("xUrl") as string) || null,
    email: (formData.get("email") as string) || null,
    footerText: (formData.get("footerText") as string) || null,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
