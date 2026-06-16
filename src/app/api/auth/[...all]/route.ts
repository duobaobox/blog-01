import { NextRequest } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/infrastructure/auth";
import { promoteToAdmin } from "@/infrastructure/auth/bootstrap";
import {
  readBootstrapEmailFromRequest,
  resolveBootstrapSignupEmail,
} from "@/infrastructure/auth/bootstrap-signup";
import { toErrorResponse } from "@/shared/lib/api-error";

const authHandler = toNextJsHandler(auth);

export const GET = authHandler.GET;

export async function POST(request: NextRequest) {
  try {
    const bootstrapEmail = await resolveBootstrapSignupEmail({
      pathname: request.nextUrl.pathname,
      headers: request.headers,
      readEmail: () => readBootstrapEmailFromRequest(request),
    });
    const response = await authHandler.POST(request);

    if (response.ok && bootstrapEmail) {
      await promoteToAdmin(bootstrapEmail);
    }

    return response;
  } catch (error) {
    return toErrorResponse(error, "Authentication failed");
  }
}
