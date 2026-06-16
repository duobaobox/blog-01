function getErrorCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export function isPublicReadDatabaseUnavailable(error: unknown) {
  const code = getErrorCode(error);

  if (code === "ECONNREFUSED" || code === "P1001") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("ECONNREFUSED")
  );
}

export async function withPublicQueryFallback<T>(
  query: () => Promise<T>,
  fallback: T,
) {
  try {
    return await query();
  } catch (error) {
    if (isPublicReadDatabaseUnavailable(error)) {
      return fallback;
    }

    throw error;
  }
}
