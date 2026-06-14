import { hashPassword, verifyPassword } from "better-auth/crypto";
import { db } from "@/infrastructure/db";
import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";

const DEFAULT_DEV_ADMIN_NAME = "Admin";
const DEFAULT_DEV_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_DEV_ADMIN_PASSWORD = "admin123456";

export function getDefaultAdminCredentials() {
  return {
    name: process.env.SEED_ADMIN_NAME?.trim() || DEFAULT_DEV_ADMIN_NAME,
    email:
      process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ||
      DEFAULT_DEV_ADMIN_EMAIL,
    password:
      process.env.SEED_ADMIN_PASSWORD?.trim() || DEFAULT_DEV_ADMIN_PASSWORD,
  };
}

export async function getUserCount() {
  return db.user.count();
}

export async function isBootstrapAllowed() {
  const userCount = await getUserCount();
  return userCount === 0;
}

export async function promoteToAdmin(email: string) {
  await db.user.updateMany({
    where: { email, role: { not: "admin" } },
    data: { role: "admin" },
  });
}

export async function ensureDefaultAdminUser() {
  return syncDefaultAdminUser({ onlyWhenEmpty: true });
}

export async function syncDefaultAdminUser(options?: {
  onlyWhenEmpty?: boolean;
}) {
  const credentials = getDefaultAdminCredentials();
  const userCount = await getUserCount();

  if (options?.onlyWhenEmpty && userCount > 0) {
    return credentials;
  }

  const existingUser = await db.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  const existingCredentialAccount = existingUser
    ? await db.account.findFirst({
        where: {
          userId: existingUser.id,
          providerId: "credential",
        },
        select: {
          id: true,
          password: true,
        },
      })
    : null;

  let passwordMatches = false;

  if (existingCredentialAccount?.password) {
    try {
      passwordMatches = await verifyPassword({
        hash: existingCredentialAccount.password,
        password: credentials.password,
      });
    } catch {
      passwordMatches = false;
    }
  }

  if (
    existingUser &&
    existingUser.role === "admin" &&
    existingUser.name === credentials.name &&
    passwordMatches
  ) {
    return credentials;
  }

  const hashedPassword = passwordMatches
    ? null
    : await hashPassword(credentials.password);

  await db.$transaction(async (tx) => {
    const user =
      existingUser ??
      (await tx.user.create({
        data: {
          email: credentials.email,
          name: credentials.name,
          role: "admin",
        },
        select: {
          id: true,
        },
      }));

    if (
      !existingUser ||
      existingUser.role !== "admin" ||
      existingUser.name !== credentials.name
    ) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: credentials.name,
          role: "admin",
        },
      });
    }

    if (!existingCredentialAccount) {
      await tx.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: hashedPassword,
        },
      });
      return;
    }

    if (hashedPassword) {
      await tx.account.update({
        where: { id: existingCredentialAccount.id },
        data: {
          password: hashedPassword,
        },
      });
    }
  });

  return credentials;
}

export async function isDefaultAdminPasswordActive(userId: string) {
  const credentials = getDefaultAdminCredentials();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
    },
  });

  if (!user) {
    return false;
  }

  if (user.name !== credentials.name || user.email !== credentials.email) {
    return false;
  }

  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
    select: {
      password: true,
    },
  });

  if (!account?.password) {
    return false;
  }

  try {
    return await verifyPassword({
      hash: account.password,
      password: credentials.password,
    });
  } catch {
    return false;
  }
}

export async function needsSiteBasicSetup() {
  const settings = await db.siteSetting.findFirst({
    select: {
      siteTitle: true,
      siteUrl: true,
    },
  });

  if (!settings) {
    return true;
  }

  const normalizedDbUrl = normalizeSiteUrl(settings.siteUrl || "");
  const normalizedDefaultUrl = normalizeSiteUrl(siteConfig.url);

  return (
    settings.siteTitle.trim() === siteConfig.name ||
    normalizedDbUrl === normalizedDefaultUrl
  );
}
