import { NotFoundError, ValidationError } from "@/shared/lib/app-error";

export function requireTrimmedString(value: unknown, message: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new ValidationError(message);
  }

  return normalized;
}

export function normalizeOptionalString(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

export function requireOneOf<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  message: string,
): T {
  const normalized = normalizeOptionalString(value);

  if (!normalized || !allowedValues.includes(normalized as T)) {
    throw new ValidationError(message);
  }

  return normalized as T;
}

export function requireEntity<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value == null) {
    throw new NotFoundError(message);
  }

  return value;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSiteResourceUrl(value: string): boolean {
  if (isHttpUrl(value)) {
    return true;
  }

  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

export function validateOptionalHttpUrl(
  value: string | null | undefined,
  message: string,
) {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    return;
  }

  if (!isHttpUrl(normalized)) {
    throw new ValidationError(message);
  }
}

export function validateOptionalSiteResourceUrl(
  value: string | null | undefined,
  message: string,
) {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    return;
  }

  if (!isSiteResourceUrl(normalized)) {
    throw new ValidationError(message);
  }
}
