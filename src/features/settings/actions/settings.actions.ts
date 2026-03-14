"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import * as settingsRepo from "@/features/settings/repositories/settings.repository";

export async function updateSiteSettings(formData: FormData) {
  await requireAdminSession();

  await settingsRepo.upsertSiteSettings({
    siteTitle: formData.get("siteTitle") as string,
    siteSubtitle: (formData.get("siteSubtitle") as string) || null,
    siteDescription: (formData.get("siteDescription") as string) || null,
    siteUrl: formData.get("siteUrl") as string,
    logoUrl: (formData.get("logoUrl") as string) || null,
    avatarUrl: (formData.get("avatarUrl") as string) || null,
    githubUrl: (formData.get("githubUrl") as string) || null,
    xUrl: (formData.get("xUrl") as string) || null,
    email: (formData.get("email") as string) || null,
    footerText: (formData.get("footerText") as string) || null,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/projects");
  revalidatePath("/blog");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
