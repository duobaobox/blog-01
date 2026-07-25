import "server-only";

import { ConfigurationError } from "@/shared/lib/app-error";

export type AiProtocol = "chat-completions";

export type AiConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  protocol: AiProtocol;
  timeoutMs: number;
  maxInputChars: number;
};

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAiConfig(): AiConfig {
  const enabled = process.env.AI_ENABLED === "true";
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const apiKey = process.env.AI_API_KEY?.trim() ?? "";
  const model = process.env.AI_MODEL?.trim() ?? "";
  const protocol = "chat-completions" as const;

  if (!enabled) {
    return {
      enabled: false,
      baseUrl,
      apiKey,
      model,
      protocol,
      timeoutMs: readPositiveInteger(process.env.AI_TIMEOUT_MS, 30_000),
      maxInputChars: readPositiveInteger(
        process.env.AI_MAX_INPUT_CHARS,
        30_000,
      ),
    };
  }

  if (!apiKey) {
    throw new ConfigurationError(
      "AI 已启用，但缺少 AI_API_KEY。请在服务端环境变量中配置 BYOK 密钥。",
    );
  }

  if (!model) {
    throw new ConfigurationError(
      "AI 已启用，但缺少 AI_MODEL。请在服务端环境变量中配置模型名称。",
    );
  }

  return {
    enabled,
    baseUrl,
    apiKey,
    model,
    protocol,
    timeoutMs: readPositiveInteger(process.env.AI_TIMEOUT_MS, 30_000),
    maxInputChars: readPositiveInteger(
      process.env.AI_MAX_INPUT_CHARS,
      30_000,
    ),
  };
}

export function getChatCompletionsUrl(config: AiConfig) {
  if (config.baseUrl.endsWith("/chat/completions")) {
    return config.baseUrl;
  }

  return `${config.baseUrl}/chat/completions`;
}
