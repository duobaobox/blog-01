import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { db } from "@/infrastructure/db";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    window: 300, // 5分钟窗口内最多5次请求
    max: 5,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 32,
      usernameValidator: (value) => /^[a-z0-9._-]+$/i.test(value),
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"] & { role: string };

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session as Omit<typeof session, "user"> & { user: AuthUser };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}
