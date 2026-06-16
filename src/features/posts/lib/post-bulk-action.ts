import { requireOneOf } from "@/shared/lib/validation";
import { ValidationError } from "@/shared/lib/app-error";

export const POST_BULK_ACTION_TYPES = [
  "setStatus",
  "setCategory",
  "setFolder",
  "replaceTags",
  "appendTags",
  "removeTags",
] as const;

export type PostBulkActionType = (typeof POST_BULK_ACTION_TYPES)[number];

export type PostBulkActionInput =
  | {
      type: "setStatus";
      postIds: string[];
      status: "draft" | "review" | "published" | "archived";
    }
  | {
      type: "setCategory";
      postIds: string[];
      categoryId: string | null;
    }
  | {
      type: "setFolder";
      postIds: string[];
      folderId: string | null;
    }
  | {
      type: "replaceTags";
      postIds: string[];
      tagIds: string[];
    }
  | {
      type: "appendTags";
      postIds: string[];
      tagIds: string[];
    }
  | {
      type: "removeTags";
      postIds: string[];
      tagIds: string[];
    };

function normalizePostIds(postIds: Iterable<unknown>) {
  const uniqueIds = new Set<string>();

  for (const value of postIds) {
    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim();
    if (normalized) {
      uniqueIds.add(normalized);
    }
  }

  return [...uniqueIds];
}

function normalizeOptionalEntityId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized || normalized === "__none__") {
    return null;
  }

  return normalized;
}

export function parsePostBulkActionFormData(formData: FormData): PostBulkActionInput {
  const type = requireOneOf(
    formData.get("type"),
    POST_BULK_ACTION_TYPES,
    "批量操作类型无效",
  );
  const postIds = normalizePostIds(formData.getAll("postIds"));

  if (postIds.length === 0) {
    throw new ValidationError("请至少选择一篇文章");
  }

  if (type === "setStatus") {
    return {
      type,
      postIds,
      status: requireOneOf(
        formData.get("status"),
        ["draft", "review", "published", "archived"] as const,
        "批量状态无效",
      ),
    };
  }

  if (type === "setCategory") {
    return {
      type,
      postIds,
      categoryId: normalizeOptionalEntityId(formData.get("categoryId")),
    };
  }

  if (type === "setFolder") {
    return {
      type,
      postIds,
      folderId: normalizeOptionalEntityId(formData.get("folderId")),
    };
  }

  return {
    type,
    postIds,
    tagIds: normalizePostIds(formData.getAll("tagIds")),
  };
}
