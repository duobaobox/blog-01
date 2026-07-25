import { ValidationError } from "@/shared/lib/app-error";

export const AI_ACTIONS = ["seo-metadata"] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

export type AiSeoMetadataResult = {
  titleCandidates: string[];
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  issues: string[];
};

export type AiGenerateInput = {
  action: AiAction;
  title: string;
  contentText: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function parseAiGenerateInput(value: unknown): AiGenerateInput {
  if (!value || typeof value !== "object") {
    throw new ValidationError("AI 请求格式不正确");
  }

  const input = value as Record<string, unknown>;
  const action = readString(input.action);
  const title = readString(input.title);
  const contentText = readString(input.contentText);

  if (!AI_ACTIONS.includes(action as AiAction)) {
    throw new ValidationError("AI 操作类型不受支持");
  }

  if (!contentText) {
    throw new ValidationError("请先输入一些文章内容，再使用 AI 助手");
  }

  return {
    action: action as AiAction,
    title,
    contentText,
    excerpt: readString(input.excerpt),
    seoTitle: readString(input.seoTitle),
    seoDescription: readString(input.seoDescription),
  };
}

export function parseAiSeoMetadataResult(value: unknown): AiSeoMetadataResult {
  if (!value || typeof value !== "object") {
    throw new ValidationError("AI 返回了无法识别的结果，请稍后重试");
  }

  const result = value as Record<string, unknown>;
  const parsed: AiSeoMetadataResult = {
    titleCandidates: readStringArray(result.titleCandidates),
    excerpt: readString(result.excerpt),
    seoTitle: readString(result.seoTitle),
    seoDescription: readString(result.seoDescription),
    issues: readStringArray(result.issues),
  };

  if (!parsed.excerpt && !parsed.seoTitle && !parsed.seoDescription) {
    throw new ValidationError("AI 没有返回可用的 SEO 建议，请稍后重试");
  }

  return parsed;
}
