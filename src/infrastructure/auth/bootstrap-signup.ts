import type { NextRequest } from "next/server";
import { ForbiddenError } from "@/shared/lib/app-error";
import { isBootstrapAllowed } from "@/infrastructure/auth/bootstrap";
import { resolveAdminBootstrapMode } from "@/infrastructure/auth/bootstrap-mode";
import {
  isAdminBootstrapRequestAllowed,
  parseBootstrapTokenFromHeaders,
} from "@/infrastructure/auth/bootstrap-token";

export function isEmailSignUpPath(pathname: string) {
  return pathname.endsWith("/sign-up/email");
}

export async function readBootstrapEmailFromRequest(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return null;
    }

    const body = (await request.clone().json()) as { email?: unknown };
    return typeof body.email === "string" ? body.email : null;
  } catch {
    return null;
  }
}

export async function resolveBootstrapSignupEmail(input: {
  pathname: string;
  headers: Headers;
  readEmail: () => Promise<string | null>;
  isBootstrapAllowed?: () => Promise<boolean>;
  configuredToken?: string | null | undefined;
  nodeEnv?: string | null | undefined;
}) {
  if (!isEmailSignUpPath(input.pathname)) {
    return null;
  }

  const canBootstrap = await (input.isBootstrapAllowed ?? isBootstrapAllowed)();
  if (!canBootstrap) {
    throw new ForbiddenError("Sign-up is disabled.");
  }

  const bootstrapMode = resolveAdminBootstrapMode({
    bootstrapAllowed: canBootstrap,
    configuredToken: input.configuredToken ?? process.env.ADMIN_SETUP_TOKEN,
    nodeEnv: input.nodeEnv ?? process.env.NODE_ENV,
  });
  if (bootstrapMode.kind !== "manual-admin-signup") {
    throw new ForbiddenError("Sign-up is disabled.");
  }

  const requestToken = parseBootstrapTokenFromHeaders(input.headers);
  if (
    !isAdminBootstrapRequestAllowed({
      configuredToken: input.configuredToken ?? process.env.ADMIN_SETUP_TOKEN,
      requestToken,
      nodeEnv: input.nodeEnv ?? process.env.NODE_ENV,
    })
  ) {
    throw new ForbiddenError("Invalid admin setup token.");
  }

  return input.readEmail();
}
