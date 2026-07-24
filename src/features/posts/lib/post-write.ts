import { parseStoredContentJsonStrict } from "@/features/editor/content-types";
import type { PostSaveIntent } from "@/features/posts/lib/post-save-plan";
import {
  normalizeOptionalString,
  requireOneOf,
  requireTrimmedString,
  validateOptionalHttpUrl,
} from "@/shared/lib/validation";

export const POST_STATUSES = ["draft", "review", "published", "archived"] as const;
export const POST_SAVE_INTENTS = [
  "autosave",
  "manual",
  "navigation",
  "publish",
] as const satisfies readonly PostSaveIntent[];

export type PostStatus = (typeof POST_STATUSES)[number];

export function isPostStatus(value: string | undefined): value is PostStatus {
  return Boolean(value) && POST_STATUSES.includes(value as PostStatus);
}

export function requirePostFolderId(value: unknown) {
  return requireTrimmedString(value, "文章必须归属到文件夹");
}

export type PostWriteInput = {
  title: string;
  slug?: string;
  contentJson: unknown;
  excerpt: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  folderId: string | null;
  status: PostStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  tagIds: string[];
  saveIntent?: PostSaveIntent;
};

function parseContentJson(formData: FormData) {
  const raw = formData.get("contentJson");

  if (typeof raw !== "string" || !raw.trim()) {
    return parseStoredContentJsonStrict("");
  }

  return parseStoredContentJsonStrict(raw);
}

function parseTagIds(formData: FormData) {
  const uniqueIds = new Set<string>();

  for (const value of formData.getAll("tagIds")) {
    const normalized = normalizeOptionalString(value);

    if (normalized) {
      uniqueIds.add(normalized);
    }
  }

  return [...uniqueIds];
}

function parseSaveIntent(formData: FormData): PostSaveIntent {
  const value = normalizeOptionalString(formData.get("saveIntent"));
  return value && POST_SAVE_INTENTS.includes(value as PostSaveIntent)
    ? (value as PostSaveIntent)
    : "manual";
}

export function parsePostWriteFormData(formData: FormData): PostWriteInput {
  const canonicalUrl = normalizeOptionalString(formData.get("canonicalUrl"));
  validateOptionalHttpUrl(
    canonicalUrl,
    "Canonical URL 格式不正确，请填写完整的 http/https 地址",
  );

  return {
    title: normalizeOptionalString(formData.get("title")) ?? "",
    slug: normalizeOptionalString(formData.get("slug")) ?? undefined,
    contentJson: parseContentJson(formData),
    excerpt: normalizeOptionalString(formData.get("excerpt")),
    coverImageUrl: normalizeOptionalString(formData.get("coverImageUrl")),
    categoryId: normalizeOptionalString(formData.get("categoryId")),
    folderId: requirePostFolderId(formData.get("folderId")),
    status: requireOneOf(
      formData.get("status"),
      POST_STATUSES,
      "文章状态无效",
    ),
    seoTitle: normalizeOptionalString(formData.get("seoTitle")),
    seoDescription: normalizeOptionalString(formData.get("seoDescription")),
    canonicalUrl,
    isFeatured: formData.get("isFeatured") === "true",
    tagIds: parseTagIds(formData),
    saveIntent: parseSaveIntent(formData),
  };
}
