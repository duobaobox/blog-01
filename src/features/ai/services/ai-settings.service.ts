import * as aiSettingsRepo from "@/features/ai/repositories/ai-settings.repository";
import { encryptAiApiKey } from "@/features/ai/lib/ai-secrets";
import { ValidationError } from "@/shared/lib/app-error";
import type { AiSettingsWriteInput } from "@/features/ai/lib/ai-settings-write";

export async function updateAiSettings(input: AiSettingsWriteInput) {
  const existingSettings = await aiSettingsRepo.findAiSettings();


  if (
    input.enabled &&
    !input.apiKey &&
    !existingSettings.aiApiKeyEncrypted &&
    !input.clearApiKey
  ) {
    throw new ValidationError("启用 AI 前请填写 API Key。");
  }

  let aiApiKeyEncrypted = existingSettings.aiApiKeyEncrypted;

  if (input.clearApiKey) {
    aiApiKeyEncrypted = null;
  } else if (input.apiKey) {
    aiApiKeyEncrypted = encryptAiApiKey(input.apiKey);
  }

  if (input.enabled && !aiApiKeyEncrypted) {
    throw new ValidationError("启用 AI 前请配置 API Key。");
  }

  await aiSettingsRepo.upsertAiSettings({
    aiConfigured: true,
    aiEnabled: input.enabled,
    aiProvider: input.provider,
    aiBaseUrl: input.baseUrl,
    aiModel: input.model || null,
    aiApiKeyEncrypted,
    aiProtocol: input.protocol,
  });
}
