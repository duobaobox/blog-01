import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/infrastructure/auth";
import {
  isBootstrapAllowed,
  promoteToAdmin,
} from "@/infrastructure/auth/bootstrap";

const authHandler = toNextJsHandler(auth);

function isEmailSignUpRequest(request: NextRequest) {
  return request.nextUrl.pathname.endsWith("/sign-up/email");
}

async function getBootstrapEmail(request: NextRequest) {
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

export const GET = authHandler.GET;

export async function POST(request: NextRequest) {
  const isEmailSignUp = isEmailSignUpRequest(request);

  if (isEmailSignUp) {
    if (!(await isBootstrapAllowed())) {
      return NextResponse.json(
        { error: "Sign-up is disabled." },
        { status: 403 },
      );
    }
  }

  const bootstrapEmail = isEmailSignUp
    ? await getBootstrapEmail(request)
    : null;
  const response = await authHandler.POST(request);

  if (response.ok && bootstrapEmail) {
    await promoteToAdmin(bootstrapEmail);
  }

  return response;
}
