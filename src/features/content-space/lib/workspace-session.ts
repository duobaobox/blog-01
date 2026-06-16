import type {
  ContentLibraryFilters,
  ContentSpaceEntry,
} from "@/features/content-space/lib/content-space-workspace";

export type WorkspaceSession = {
  activeEntry: "all" | ContentSpaceEntry | "post";
  folderId?: string;
  postId?: string;
  page?: number;
  filters?: ContentLibraryFilters;
  searchQuery?: string;
};

const STORAGE_KEY = "admin-content-space-session";
const SESSION_VERSION = 2;

type SerializedWorkspaceSession = {
  version: typeof SESSION_VERSION;
  session: WorkspaceSession;
};

function isOptionalString(value: unknown) {
  return typeof value === "undefined" || typeof value === "string";
}

function isOptionalPositiveInteger(value: unknown) {
  return (
    typeof value === "undefined" ||
    (typeof value === "number" && Number.isInteger(value) && value > 0)
  );
}

function isOptionalFilters(value: unknown) {
  if (typeof value === "undefined") {
    return true;
  }

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

function isWorkspaceSession(value: unknown): value is WorkspaceSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    candidate.activeEntry !== "all" &&
    candidate.activeEntry !== "library" &&
    candidate.activeEntry !== "recent" &&
    candidate.activeEntry !== "drafts" &&
    candidate.activeEntry !== "ready" &&
    candidate.activeEntry !== "folder" &&
    candidate.activeEntry !== "post" &&
    candidate.activeEntry !== "search"
  ) {
    return false;
  }

  return (
    isOptionalString(candidate.folderId) &&
    isOptionalString(candidate.postId) &&
    isOptionalPositiveInteger(candidate.page) &&
    isOptionalFilters(candidate.filters) &&
    isOptionalString(candidate.searchQuery)
  );
}

export function serializeWorkspaceSession(session: WorkspaceSession) {
  return JSON.stringify({
    version: SESSION_VERSION,
    session,
  } satisfies SerializedWorkspaceSession);
}

export function deserializeWorkspaceSession(raw: string | null | undefined) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isWorkspaceSession(parsed)) {
      return parsed;
    }

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const wrapped = parsed as Record<string, unknown>;
    return wrapped.version === SESSION_VERSION && isWorkspaceSession(wrapped.session)
      ? wrapped.session
      : null;
  } catch {
    return null;
  }
}

export function buildWorkspaceSessionRestoreParams(session: WorkspaceSession): Partial<{
  entry: ContentSpaceEntry;
  folderId: string;
  postId: string;
  view: "edit";
  page: number;
  filters: ContentLibraryFilters;
  q: string;
}> {
  const next: Partial<{
    entry: ContentSpaceEntry;
    folderId: string;
    postId: string;
    view: "edit";
    page: number;
    filters: ContentLibraryFilters;
    q: string;
  }> = { view: "edit" };

  if (session.searchQuery) {
    next.entry = "search";
    next.q = session.searchQuery;
    next.folderId = session.folderId;
  } else if (session.activeEntry === "drafts" || session.activeEntry === "ready") {
    next.entry = session.activeEntry;
  } else if (
    (session.activeEntry === "folder" || session.activeEntry === "post") &&
    session.folderId
  ) {
    next.entry = "folder";
    next.folderId = session.folderId;
  } else {
    next.entry = session.activeEntry === "recent" ? "recent" : "library";
    next.page = session.page;
    next.filters = session.filters;
  }

  if (session.postId) {
    next.postId = session.postId;
  }

  return next;
}

export function shouldPersistWorkspaceSessionToServer(session: WorkspaceSession) {
  return Boolean(
    session.searchQuery ||
      session.folderId ||
      session.postId ||
      session.page ||
      (session.filters && Object.keys(session.filters).length > 0),
  );
}

export function loadWorkspaceSession(): WorkspaceSession | null {
  if (typeof window === "undefined") return null;
  return deserializeWorkspaceSession(window.localStorage.getItem(STORAGE_KEY));
}

export function saveWorkspaceSession(session: WorkspaceSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serializeWorkspaceSession(session));
}
