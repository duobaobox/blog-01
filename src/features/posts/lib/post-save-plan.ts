export type PostSaveIntent = "autosave" | "manual" | "navigation" | "publish";

export type PostMediaReferenceKey = {
  mediaId: string;
  usage: string;
};

function normalizeContentValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeContentValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const key of Object.keys(record).sort()) {
    if (
      key === "attrs" &&
      record.type === "heading" &&
      record.attrs &&
      typeof record.attrs === "object" &&
      !Array.isArray(record.attrs)
    ) {
      const attrs = record.attrs as Record<string, unknown>;
      const normalizedAttrs: Record<string, unknown> = {};

      for (const attrKey of Object.keys(attrs).sort()) {
        if (attrKey === "id") continue;
        normalizedAttrs[attrKey] = normalizeContentValue(attrs[attrKey]);
      }

      normalized.attrs = normalizedAttrs;
      continue;
    }

    normalized[key] = normalizeContentValue(record[key]);
  }

  return normalized;
}

export function hasPostContentChanged(previous: unknown, next: unknown) {
  return (
    JSON.stringify(normalizeContentValue(previous)) !==
    JSON.stringify(normalizeContentValue(next))
  );
}

export function areStringSetsEqual(previous: string[], next: string[]) {
  if (previous.length !== next.length) return false;

  const previousSet = new Set(previous);
  if (previousSet.size !== next.length) return false;

  return next.every((value) => previousSet.has(value));
}

function mediaReferenceKey(reference: PostMediaReferenceKey) {
  return `${reference.mediaId}:${reference.usage}`;
}

export function areMediaReferenceSetsEqual(
  previous: PostMediaReferenceKey[],
  next: PostMediaReferenceKey[],
) {
  return areStringSetsEqual(
    previous.map(mediaReferenceKey),
    next.map(mediaReferenceKey),
  );
}

export function isUserInitiatedPostSave(saveIntent?: PostSaveIntent) {
  return saveIntent === "manual" || saveIntent === "publish";
}

export function shouldLogPostUpdate(input: {
  saveIntent?: PostSaveIntent;
  previousStatus: string;
  nextStatus: string;
}) {
  return isUserInitiatedPostSave(input.saveIntent);
}

export function shouldRevalidateAdminAfterSave(
  saveIntent?: PostSaveIntent,
) {
  return saveIntent !== "autosave";
}
