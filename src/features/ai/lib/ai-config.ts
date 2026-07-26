import "server-only";

import { decryptAiApiKey } from "@/features/ai/lib/ai-secrets";
import { findAiSettings } from "@/features/ai/repositories/ai-settings.repository";
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

function readEnvironmentConfig() {
  return {
    enabled: process.env.AI_ENABLED === "true",
    baseUrl: (
      process.env.AI_BASE_URL || "https://api.openai.com/v1"
    ).replace(/\/+$/, ""),
    apiKey: process.env.AI_API_KEY?.trim() ?? "",
    model: process.env.AI_MODEL?.trim() ?? "",
    protocol: process.env.AI_PROTOCOL || "chat-completions",
  };
}

export async function getAiConfig(): Promise<AiConfig> {
  const settings = await findAiSettings();
  const environment = readEnvironmentConfig();
  const useStoredConfig = Boolean(settings?.aiConfigured);

  const enabled = useStoredConfig ? true : environment.enabled;
  const baseUrl = (
    useStoredConfig ? settings?.aiBaseUrl || environment.baseUrl : environment.baseUrl
  ).replace(/\/+$/, "");
  const apiKey = useStoredConfig
    ? decryptAiApiKey(settings?.aiApiKeyEncrypted)
    : environment.apiKey;
  const model = useStoredConfig
    ? settings?.aiModel?.trim() || ""
    : environment.model;
  const protocolValue = useStoredConfig
    ? settings?.aiProtocol || "chat-completions"
    : environment.protocol;

  if (protocolValue !== "chat-completions") {
    throw new ConfigurationError(
      "当前只支持 OpenAI-compatible Chat Completions 协议。",
    );
  }

  if (!enabled) {
    return {
      enabled: false,
      baseUrl,
      apiKey,
      model,
      protocol: "chat-completions",
      timeoutMs: readPositiveInteger(process.env.AI_TIMEOUT_MS, 30_000),
      maxInputChars: readPositiveInteger(
        process.env.AI_MAX_INPUT_CHARS,
        30_000,
      ),
    };
  }

  if (!apiKey) {
    throw new ConfigurationError(
      useStoredConfig
        ? "AI 已绑定，但还没有配置 API Key。请到后台 AI 设置中完成 BYOK 配置。"
        : "AI 已启用，但缺少 AI_API_KEY。请在服务端环境变量中配置 BYOK 密钥。",
    );
  }

  if (!model) {
    throw new ConfigurationError(
      useStoredConfig
        ? "AI 已绑定，但还没有配置模型名称。请到后台 AI 设置中完成 BYOK 配置。"
        : "AI 已启用，但缺少 AI_MODEL。请在服务端环境变量中配置模型名称。",
    );
  }

  return {
    enabled,
    baseUrl,
    apiKey,
    model,
    protocol: "chat-completions",
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
