"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function getSiteSettings() {
  return db.siteSetting.findFirst();
}

export async function updateSiteSettings(formData: FormData) {
  await requireSession();

  const data = {
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
  };

  const existing = await db.siteSetting.findFirst();

  if (existing) {
    await db.siteSetting.update({ where: { id: existing.id }, data });
  } else {
    await db.siteSetting.create({ data });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
