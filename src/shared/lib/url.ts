function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

export function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    return trimTrailingSlashes(url.toString());
  } catch {
    return trimTrailingSlashes(trimmed);
  }
}

export function joinSiteUrl(baseUrl: string, pathname = "") {
  const normalizedBaseUrl = normalizeSiteUrl(baseUrl);
  const normalizedPathname = pathname.replace(/^\/+/, "");

  if (!normalizedPathname) {
    return normalizedBaseUrl;
  }

  try {
    return new URL(normalizedPathname, `${normalizedBaseUrl}/`).toString();
  } catch {
    return `${normalizedBaseUrl}/${normalizedPathname}`;
  }
}
