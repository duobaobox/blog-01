import { getAiProviderPreset } from "@/features/ai/lib/ai-provider-presets";
import { normalizeOptionalString, validateOptionalHttpUrl } from "@/shared/lib/validation";
import { ValidationError } from "@/shared/lib/app-error";

export type AiSettingsWriteInput = {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  clearApiKey: boolean;
  protocol: "chat-completions";
};

export function parseAiSettingsFormData(
  formData: FormData,
): AiSettingsWriteInput {
  const provider = normalizeOptionalString(formData.get("aiProvider")) || "custom";
  const preset = getAiProviderPreset(provider);
  const baseUrl =
    normalizeOptionalString(formData.get("aiBaseUrl")) || preset.baseUrl;
  const model = normalizeOptionalString(formData.get("aiModel")) || "";
  const apiKey = normalizeOptionalString(formData.get("aiApiKey")) || "";
  const clearApiKey = formData.get("aiClearApiKey") === "true";

  if (!baseUrl) {
    throw new ValidationError("请填写 AI Base URL");
  }

  validateOptionalHttpUrl(
    baseUrl,
    "AI Base URL 格式不正确，请填写完整的 http/https 地址",
  );

  if (!model) {
    throw new ValidationError("请填写模型名称");
  }

  if (clearApiKey && apiKey) {
    throw new ValidationError("不能同时填写新 Key 和清除旧 Key");
  }

  if (provider === "custom" && !baseUrl) {
    throw new ValidationError("自定义服务商需要填写 Base URL");
  }

  return {
    provider,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    apiKey,
    clearApiKey,
    protocol: "chat-completions",
  };
}
