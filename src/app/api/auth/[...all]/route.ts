import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/infrastructure/auth";
import { db } from "@/infrastructure/db";

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

async function isBootstrapAllowed(request: NextRequest) {
  const userCount = await db.user.count();

  if (userCount > 0) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  const providedToken = request.headers.get("x-admin-setup-token");

  return Boolean(expectedToken && providedToken === expectedToken);
}

export const GET = authHandler.GET;

export async function POST(request: NextRequest) {
  const isEmailSignUp = isEmailSignUpRequest(request);

  if (isEmailSignUp && !(await isBootstrapAllowed(request))) {
    return NextResponse.json(
      { error: "Sign-up is disabled." },
      { status: 403 },
    );
  }

  const bootstrapEmail = isEmailSignUp
    ? await getBootstrapEmail(request)
    : null;
  const response = await authHandler.POST(request);

  if (response.ok && bootstrapEmail) {
    await db.user.updateMany({
      where: { email: bootstrapEmail, role: { not: "admin" } },
      data: { role: "admin" },
    });
  }

  return response;
}
