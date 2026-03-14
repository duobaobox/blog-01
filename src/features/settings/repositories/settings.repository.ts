import { db } from "@/infrastructure/db";

export async function findSiteSettings() {
  return db.siteSetting.findFirst();
}

export async function upsertSiteSettings(data: {
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
}) {
  const existing = await findSiteSettings();

  if (existing) {
    return db.siteSetting.update({
      where: { id: existing.id },
      data,
    });
  }

  return db.siteSetting.create({ data });
}
