export type WorkspaceSession = {
  activeEntry: "recent" | "drafts" | "ready" | "topic" | "subtopic" | "post";
  topicId?: string;
  subtopicId?: string;
  postId?: string;
};

const STORAGE_KEY = "admin-content-space-session";

function isOptionalString(value: unknown) {
  return typeof value === "undefined" || typeof value === "string";
}

function isWorkspaceSession(value: unknown): value is WorkspaceSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    candidate.activeEntry !== "recent" &&
    candidate.activeEntry !== "drafts" &&
    candidate.activeEntry !== "ready" &&
    candidate.activeEntry !== "topic" &&
    candidate.activeEntry !== "subtopic" &&
    candidate.activeEntry !== "post"
  ) {
    return false;
  }

  return (
    isOptionalString(candidate.topicId) &&
    isOptionalString(candidate.subtopicId) &&
    isOptionalString(candidate.postId)
  );
}

export function serializeWorkspaceSession(session: WorkspaceSession) {
  return JSON.stringify(session);
}

export function deserializeWorkspaceSession(raw: string | null | undefined) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isWorkspaceSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadWorkspaceSession(): WorkspaceSession | null {
  if (typeof window === "undefined") return null;
  return deserializeWorkspaceSession(window.localStorage.getItem(STORAGE_KEY));
}

export function saveWorkspaceSession(session: WorkspaceSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serializeWorkspaceSession(session));
}
