import * as aiSettingsRepo from "@/features/ai/repositories/ai-settings.repository";
import { canReuseStoredAiApiKey } from "@/features/ai/lib/ai-base-url-guard";
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

  // 已保存的密钥只在源站不变时沿用：否则只要把 Base URL 改到任意地址，
  // 服务端就会带着解密后的密钥去请求，等于把密钥交给对方。
  if (
    !input.clearApiKey &&
    !input.apiKey &&
    existingSettings?.aiApiKeyEncrypted &&
    !canReuseStoredAiApiKey({
      existingBaseUrl: existingSettings.aiBaseUrl,
      nextBaseUrl: input.baseUrl,
    })
  ) {
    throw new ValidationError(
      "更换 AI Base URL 后需要重新填写 API Key，避免已保存的密钥被发送到新的地址。",
    );
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
