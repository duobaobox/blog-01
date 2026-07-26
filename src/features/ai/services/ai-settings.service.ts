import * as aiSettingsRepo from "@/features/ai/repositories/ai-settings.repository";
import { encryptAiApiKey } from "@/features/ai/lib/ai-secrets";
import { ValidationError } from "@/shared/lib/app-error";
import type { AiSettingsWriteInput } from "@/features/ai/lib/ai-settings-write";

export async function updateAiSettings(input: AiSettingsWriteInput) {
  const existingSettings = await aiSettingsRepo.findAiSettings();

  if (
    !input.apiKey &&
    !existingSettings?.aiApiKeyEncrypted &&
    !input.clearApiKey
  ) {
    throw new ValidationError("请填写 API Key。");
  }

  let aiApiKeyEncrypted = existingSettings?.aiApiKeyEncrypted ?? null;

  if (input.clearApiKey) {
    aiApiKeyEncrypted = null;
  } else if (input.apiKey) {
    aiApiKeyEncrypted = encryptAiApiKey(input.apiKey);
  }

  if (!aiApiKeyEncrypted && !input.clearApiKey) {
    throw new ValidationError("请配置 API Key。");
  }

  await aiSettingsRepo.upsertAiSettings({
    aiConfigured: Boolean(aiApiKeyEncrypted),
    aiProvider: input.provider,
    aiBaseUrl: input.baseUrl,
    aiModel: input.model || null,
    aiApiKeyEncrypted,
    aiProtocol: input.protocol,
  });
}
