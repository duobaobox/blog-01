import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { db } from "@/infrastructure/db";
import { resolveTrustedProxies } from "@/infrastructure/auth/trusted-proxies";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/app-error";
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
  advanced: {
    ipAddress: {
      // 限流按 IP 分桶，取错 IP 会同时造成两种问题：客户端伪造一个地址就换到新的
      // 额度（暴力破解不限次），或者所有访客落到同一个桶里（5 次匿名请求就能把
      // 管理员锁在 429 之外 5 分钟）。
      //
      // x-real-ip 由反向代理用 $remote_addr 覆写，客户端无法伪造，优先使用；
      // 缺失时回落到 x-forwarded-for，并按可信代理链从右往左解析——代理追加在末尾
      // 的那一段才是真实客户端地址，左侧的伪造值会被跳过。
      ipAddressHeaders: ["x-real-ip", "x-forwarded-for"],
      trustedProxies: resolveTrustedProxies(
        process.env.BETTER_AUTH_TRUSTED_PROXIES,
      ),
    },
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
    throw new UnauthorizedError();
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new ForbiddenError();
  }
  return session;
}
