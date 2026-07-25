import { ValidationError } from "@/shared/lib/app-error";

export const AI_ACTIONS = ["seo-metadata", "edit-text"] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

export const AI_EDIT_OPERATIONS = [
  "polish",
  "simplify",
  "expand",
  "shorten",
  "professional",
  "conversational",
  "custom",
] as const;

export type AiEditOperation = (typeof AI_EDIT_OPERATIONS)[number];

export type AiSeoMetadataResult = {
  titleCandidates: string[];
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  issues: string[];
};

export type AiEditTextResult = {
  text: string;
};

export type AiGenerateInput = {
  action: AiAction;
  title: string;
  contentText: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  operation?: AiEditOperation;
  instruction?: string;
  selectionText?: string;
  beforeContext?: string;
  afterContext?: string;
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
  const selectionText = readString(input.selectionText) || contentText;
  const operation = readString(input.operation) as AiEditOperation;
  const instruction = readString(input.instruction);
  const beforeContext = readString(input.beforeContext);
  const afterContext = readString(input.afterContext);

  if (!AI_ACTIONS.includes(action as AiAction)) {
    throw new ValidationError("AI 操作类型不受支持");
  }

  if (!contentText) {
    throw new ValidationError("请先输入一些文章内容，再使用 AI 助手");
  }

  if (action === "edit-text") {
    if (!selectionText) {
      throw new ValidationError("请先选中一段正文，再使用 AI 改写");
    }

    if (!AI_EDIT_OPERATIONS.includes(operation)) {
      throw new ValidationError("AI 改写方式不受支持");
    }
  }

  return {
    action: action as AiAction,
    title,
    contentText,
    excerpt: readString(input.excerpt),
    seoTitle: readString(input.seoTitle),
    seoDescription: readString(input.seoDescription),
    operation: AI_EDIT_OPERATIONS.includes(operation) ? operation : undefined,
    instruction,
    selectionText,
    beforeContext,
    afterContext,
  };
}

export function parseAiEditTextResult(value: unknown): AiEditTextResult {
  if (!value || typeof value !== "object") {
    throw new ValidationError("AI 返回了无法识别的改写结果，请稍后重试");
  }

  const text = readString((value as Record<string, unknown>).text);

  if (!text) {
    throw new ValidationError("AI 没有返回可用的改写内容，请稍后重试");
  }

  return { text };
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
