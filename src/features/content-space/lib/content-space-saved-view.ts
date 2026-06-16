import {
  MAX_SAVED_CONTENT_VIEWS,
  buildSavedContentView,
  getSavedContentViewNameKey,
  normalizeSavedContentView,
  normalizeSavedContentViewInput,
  parseSavedContentViewFilters,
  type SavedContentView,
} from "@/features/content-space/lib/content-space-saved-view-shared";
import type { ContentLibraryFilters } from "@/features/content-space/lib/content-space-workspace";

type SavedContentViewsPayload = {
  version: 1;
  views: SavedContentView[];
};

function isSavedContentView(value: unknown): value is SavedContentView {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function isSavedContentViewsPayload(value: unknown): value is SavedContentViewsPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.version === 1 && Array.isArray(candidate.views);
}

function buildSavedContentViewsPayload(views: SavedContentView[]): SavedContentViewsPayload {
  return {
    version: 1,
    views,
  };
}

function normalizeStoredSavedContentView(value: SavedContentView) {
  return buildSavedContentView({
    id: value.id,
    name: value.name,
    filters: parseSavedContentViewFilters(value.filters),
    createdAt: value.createdAt,
  });
}

export type { SavedContentView };
export { MAX_SAVED_CONTENT_VIEWS } from "@/features/content-space/lib/content-space-saved-view-shared";
export {
  normalizeSavedContentViewName,
  normalizeContentLibraryFilters,
} from "@/features/content-space/lib/content-space-saved-view-shared";

export function serializeSavedContentViews(views: SavedContentView[]) {
  return JSON.stringify(
    buildSavedContentViewsPayload(views.map(normalizeSavedContentView)),
  );
}

export function deserializeSavedContentViews(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter(isSavedContentView)
        .map(normalizeStoredSavedContentView);
    }

    if (!isSavedContentViewsPayload(parsed)) {
      return [];
    }

    return parsed.views
      .filter(isSavedContentView)
      .map(normalizeStoredSavedContentView);
  } catch {
    return [];
  }
}

export function createSavedContentView(input: {
  name: string;
  filters: ContentLibraryFilters;
}): SavedContentView {
  const normalized = normalizeSavedContentViewInput(input);

  return {
    id: crypto.randomUUID(),
    name: normalized.name,
    filters: normalized.filters,
    createdAt: new Date().toISOString(),
  };
}

export function saveOrReplaceSavedContentView(
  views: SavedContentView[],
  input: {
    name: string;
    filters: ContentLibraryFilters;
  },
) {
  const nextView = createSavedContentView(input);
  const nextNameKey = getSavedContentViewNameKey(nextView.name);

  return [
    nextView,
    ...views.filter((view) => getSavedContentViewNameKey(view.name) !== nextNameKey),
  ].slice(0, MAX_SAVED_CONTENT_VIEWS);
}
