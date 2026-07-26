import { db } from "@/infrastructure/db";

export const SITE_SETTINGS_SINGLETON_KEY = "default";

export async function findSiteSettings() {
  return db.siteSetting.findUnique({
    where: {
      scopeKey: SITE_SETTINGS_SINGLETON_KEY,
    },
  });
}

export async function findSiteSettingsForAdmin() {
  const settings = await db.siteSetting.findUnique({
    where: {
      scopeKey: SITE_SETTINGS_SINGLETON_KEY,
    },
    select: {
      siteTitle: true,
      siteDescription: true,
      siteUrl: true,
      logoUrl: true,
      email: true,
      footerText: true,
    },
  });

  if (!settings) return null;

  return settings;
}

export async function findSiteSettingsSummary() {
  return db.siteSetting.findUnique({
    where: {
      scopeKey: SITE_SETTINGS_SINGLETON_KEY,
    },
    select: {
      siteTitle: true,
    },
  });
}

export async function upsertSiteSettings(data: {
  siteTitle: string;
  siteDescription: string | null;
  siteUrl: string;
  logoUrl: string | null;
  email: string | null;
  footerText: string | null;
}) {
  return db.siteSetting.upsert({
    where: {
      scopeKey: SITE_SETTINGS_SINGLETON_KEY,
    },
    update: data,
    create: {
      scopeKey: SITE_SETTINGS_SINGLETON_KEY,
      ...data,
    },
  });
}

export async function updateAdminProfile(
  userId: string,
  data: {
    name: string;
  },
) {
  return db.user.update({
    where: { id: userId },
    data,
  });
}
