import { timingSafeEqual } from "node:crypto";

export const ADMIN_SETUP_TOKEN_HEADER = "x-admin-setup-token";

function normalizeToken(value: string | null | undefined) {
  const token = value?.trim();
  return token ? token : null;
}

function tokenMatches(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function parseBootstrapTokenFromHeaders(headers: Headers) {
  return normalizeToken(headers.get(ADMIN_SETUP_TOKEN_HEADER));
}

export function isAdminBootstrapRequestAllowed({
  configuredToken,
  requestToken,
  nodeEnv,
}: {
  configuredToken: string | null | undefined;
  requestToken: string | null | undefined;
  nodeEnv: string | null | undefined;
}) {
  const expectedToken = normalizeToken(configuredToken);
  const actualToken = normalizeToken(requestToken);

  if (!expectedToken) {
    return nodeEnv !== "production";
  }

  return Boolean(actualToken && tokenMatches(expectedToken, actualToken));
}
