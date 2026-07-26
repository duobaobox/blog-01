import { db } from "@/infrastructure/db";

export const AI_SETTINGS_SINGLETON_KEY = "default";

export async function findAiSettings() {
  return db.aiSetting.findUnique({
    where: {
      scopeKey: AI_SETTINGS_SINGLETON_KEY,
    },
  });
}

export async function findAiSettingsForAdmin() {
  const settings = await db.aiSetting.findUnique({
    where: {
      scopeKey: AI_SETTINGS_SINGLETON_KEY,
    },
    select: {
      aiConfigured: true,
      aiProvider: true,
      aiBaseUrl: true,
      aiModel: true,
      aiProtocol: true,
      aiApiKeyEncrypted: true,
    },
  });

  if (!settings) return null;

  const { aiApiKeyEncrypted, ...safeSettings } = settings;

  return {
    ...safeSettings,
    aiApiKeyConfigured: Boolean(aiApiKeyEncrypted),
  };
}

export async function upsertAiSettings(data: {
  aiConfigured: boolean;
  aiProvider: string;
  aiBaseUrl: string;
  aiModel: string | null;
  aiApiKeyEncrypted: string | null;
  aiProtocol: string;
}) {
  return db.aiSetting.upsert({
    where: {
      scopeKey: AI_SETTINGS_SINGLETON_KEY,
    },
    update: data,
    create: {
      scopeKey: AI_SETTINGS_SINGLETON_KEY,
      ...data,
    },
  });
}
