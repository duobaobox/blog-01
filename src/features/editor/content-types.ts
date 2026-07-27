import type { JSONContent } from "@tiptap/core";

export type TocItem = {
  id: string;
  title: string;
  level: number;
};

export class ContentJsonParseError extends Error {
  constructor(message = "文章内容格式无效，请刷新后重试。") {
    super(message);
    this.name = "ContentJsonParseError";
  }
}

const MEANINGFUL_VOID_NODE_TYPES = new Set([
  "image",
  "horizontalRule",
  "table",
]);

function createEmptyDoc(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

function hasMeaningfulNode(node: JSONContent | null | undefined): boolean {
  if (!node) {
    return false;
  }

  if (node.type === "text") {
    return Boolean(node.text?.trim());
  }

  if (node.type && MEANINGFUL_VOID_NODE_TYPES.has(node.type)) {
    return true;
  }

  return node.content?.some((child) => hasMeaningfulNode(child)) ?? false;
}

export function cloneContentJson(value: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(value)) as JSONContent;
}

export function normalizeContentJson(
  value: unknown | null | undefined,
): JSONContent {
  if (!value || typeof value !== "object") {
    return createEmptyDoc();
  }

  const candidate = value as JSONContent;

  if (candidate.type !== "doc") {
    return createEmptyDoc();
  }

  if (!Array.isArray(candidate.content) || candidate.content.length === 0) {
    return createEmptyDoc();
  }

  return candidate;
}

export function normalizeContentJsonStrict(
  value: unknown | null | undefined,
): JSONContent {
  if (!value || typeof value !== "object") {
    throw new ContentJsonParseError();
  }

  const candidate = value as JSONContent;

  if (candidate.type !== "doc") {
    throw new ContentJsonParseError();
  }

  if (!Array.isArray(candidate.content) || candidate.content.length === 0) {
    throw new ContentJsonParseError();
  }

  return candidate;
}

export function parseStoredContentJson(
  value: string | null | undefined,
): JSONContent {
  if (typeof value !== "string" || !value.trim()) {
    return createEmptyDoc();
  }

  try {
    return normalizeContentJson(JSON.parse(value));
  } catch {
    return createEmptyDoc();
  }
}

export function parseStoredContentJsonStrict(
  value: string | null | undefined,
): JSONContent {
  if (typeof value !== "string" || !value.trim()) {
    return createEmptyDoc();
  }

  try {
    return normalizeContentJsonStrict(JSON.parse(value));
  } catch (error) {
    if (error instanceof ContentJsonParseError) {
      throw error;
    }

    throw new ContentJsonParseError();
  }
}

export function stringifyContentJson(
  value: unknown | null | undefined,
): string {
  return JSON.stringify(normalizeContentJson(value));
}

export function hasMeaningfulContent(
  value: unknown | null | undefined,
): boolean {
  return hasMeaningfulNode(normalizeContentJson(value));
}

export function parseToc(value: unknown): TocItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.title !== "string" ||
      typeof candidate.level !== "number"
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        title: candidate.title,
        level: candidate.level,
      },
    ];
  });
}
