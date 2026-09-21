export type AiProviderBrand = {
  /** 品牌字标，显示在卡片图标内 */
  initial: string;
  /** 品牌主色，用于图标与光晕 */
  color: string;
};

export type AiProviderPreset = {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  description: string;
  docsUrl: string;
  /** 品牌标识；custom 预设不提供 */
  brand?: AiProviderBrand;
};

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: "openai-compatible",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    description: "OpenAI 官方 OpenAI-compatible Chat Completions 接口。",
    docsUrl: "https://platform.openai.com/docs/api-reference/chat",
    brand: { initial: "O", color: "#10A37F" },
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    description: "DeepSeek 官方兼容接口，Base URL 不需要额外添加 /v1。",
    docsUrl: "https://api-docs.deepseek.com/",
    brand: { initial: "DS", color: "#4D6BFE" },
  },
  {
    id: "qwen",
    name: "阿里云百炼 / 通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    description: "适合中文写作；也可以替换为百炼业务空间专属 Base URL。",
    docsUrl:
      "https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions",
    brand: { initial: "Q", color: "#FF6A00" },
  },
  {
    id: "zhipu",
    name: "智谱 AI / GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-5.2",
    description: "智谱官方 OpenAI 兼容 Chat Completions 接口。",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction",
    brand: { initial: "G", color: "#0E63F5" },
  },
  {
    id: "moonshot",
    name: "月之暗面 / Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "kimi-k3",
    description: "Kimi 官方 OpenAI 兼容接口，适合长文本和中文内容处理。",
    docsUrl:
      "https://platform.moonshot.cn/docs/guide/migrating-from-openai-to-kimi",
    brand: { initial: "K", color: "#111111" },
  },
  {
    id: "volcengine",
    name: "火山方舟 / 豆包",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-seed-1-6-250615",
    description: "火山方舟标准模型调用接口；模型名称按控制台可用模型填写。",
    docsUrl: "https://www.volcengine.com/docs/82379/1298459",
    brand: { initial: "D", color: "#3370FF" },
  },
  {
    id: "siliconflow",
    name: "硅基流动",
    baseUrl: "https://api.siliconflow.cn/v1",
    defaultModel: "Qwen/Qwen3-8B",
    description: "国内模型聚合平台，适合快速切换不同开源模型。",
    docsUrl: "https://docs.siliconflow.cn/",
    brand: { initial: "S", color: "#3B82F6" },
  },
  {
    id: "custom",
    name: "自定义 OpenAI-compatible",
    baseUrl: "",
    defaultModel: "",
    description: "填写任意兼容 /chat/completions 的服务地址。",
    docsUrl: "",
  },
];

export function getAiProviderPreset(providerId: string) {
  return (
    AI_PROVIDER_PRESETS.find((provider) => provider.id === providerId) ??
    AI_PROVIDER_PRESETS[AI_PROVIDER_PRESETS.length - 1]
  );
}
