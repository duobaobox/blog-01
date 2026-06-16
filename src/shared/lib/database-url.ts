export function getDatabaseSchemaFromUrl(
  databaseUrl: string,
  fallbackSchema = "public",
) {
  try {
    const url = new URL(databaseUrl);
    return url.searchParams.get("schema") || fallbackSchema;
  } catch {
    return fallbackSchema;
  }
}
