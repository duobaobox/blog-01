import type { ContentLibraryFilters } from "@/features/content-space/lib/content-space-workspace";
import { isPostGovernanceDebtKey } from "@/features/posts/lib/post-governance";
import { isPostStatus } from "@/features/posts/lib/post-write";
import { ValidationError } from "@/shared/lib/app-error";
import { normalizeOptionalString } from "@/shared/lib/validation";

export type SavedContentView = {
  id: string;
  name: string;
  filters: ContentLibraryFilters;
  createdAt: string;
};

export const MAX_SAVED_CONTENT_VIEWS = 12;

function normalizeFilterValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeContentLibraryFilters(
  filters: ContentLibraryFilters,
): ContentLibraryFilters {
  const normalizedStatus = normalizeFilterValue(filters.status);
  const normalizedCategoryId = normalizeFilterValue(filters.categoryId);
  const normalizedTagId = normalizeFilterValue(filters.tagId);
  const normalizedDebt = filters.debt && isPostGovernanceDebtKey(filters.debt)
    ? filters.debt
    : undefined;

  return {
    ...(normalizedStatus && isPostStatus(normalizedStatus)
      ? { status: normalizedStatus }
      : {}),
    ...(normalizedCategoryId ? { categoryId: normalizedCategoryId } : {}),
    ...(normalizedTagId ? { tagId: normalizedTagId } : {}),
    ...(normalizedDebt ? { debt: normalizedDebt } : {}),
  };
}

export function normalizeSavedContentViewName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function getSavedContentViewNameKey(name: string) {
  return normalizeSavedContentViewName(name).toLocaleLowerCase();
}

function isOptionalString(value: unknown) {
  return typeof value === "undefined" || typeof value === "string";
}

export function isContentLibraryFilters(value: unknown): value is ContentLibraryFilters {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isOptionalString(candidate.status) &&
    isOptionalString(candidate.categoryId) &&
    isOptionalString(candidate.tagId) &&
    isOptionalString(candidate.debt)
  );
}

export function normalizeSavedContentView(view: SavedContentView): SavedContentView {
  return {
    ...view,
    name: normalizeSavedContentViewName(view.name),
    filters: normalizeContentLibraryFilters(view.filters),
  };
}

export function normalizeSavedContentViewInput(input: {
  name: string;
  filters: ContentLibraryFilters;
}) {
  const name = normalizeSavedContentViewName(input.name);
  if (!name) {
    throw new ValidationError("视图名称不能为空");
  }

  return {
    name,
    nameKey: getSavedContentViewNameKey(name),
    filters: normalizeContentLibraryFilters(input.filters),
  };
}

export function parseSavedContentViewFilters(raw: unknown): ContentLibraryFilters {
  if (!isContentLibraryFilters(raw)) {
    return {};
  }

  return normalizeContentLibraryFilters(raw);
}

export function parseSavedContentViewInput(formData: FormData) {
  const rawName = normalizeOptionalString(formData.get("name")) ?? "";
  const rawStatus = normalizeOptionalString(formData.get("status")) ?? undefined;
  const rawCategoryId = normalizeOptionalString(formData.get("categoryId")) ?? undefined;
  const rawTagId = normalizeOptionalString(formData.get("tagId")) ?? undefined;
  const rawDebt = normalizeOptionalString(formData.get("debt")) ?? undefined;
  if (rawStatus && !isPostStatus(rawStatus)) {
    throw new ValidationError("文章状态筛选无效");
  }

  if (rawDebt && !isPostGovernanceDebtKey(rawDebt)) {
    throw new ValidationError("治理视图筛选无效");
  }

  return normalizeSavedContentViewInput({
    name: rawName,
    filters: {
      ...(rawStatus ? { status: rawStatus } : {}),
      ...(rawCategoryId ? { categoryId: rawCategoryId } : {}),
      ...(rawTagId ? { tagId: rawTagId } : {}),
      ...(rawDebt ? { debt: rawDebt as ContentLibraryFilters["debt"] } : {}),
    },
  });
}

export function buildSavedContentView(input: {
  id: string;
  name: string;
  filters: ContentLibraryFilters;
  createdAt: Date | string;
}): SavedContentView {
  return normalizeSavedContentView({
    id: input.id,
    name: input.name,
    filters: input.filters,
    createdAt:
      input.createdAt instanceof Date
        ? input.createdAt.toISOString()
        : input.createdAt,
  });
}
