import { hashPassword, verifyPassword } from "better-auth/crypto";
import { db } from "@/infrastructure/db";
import { siteConfig } from "@/shared/config/site.config";
import { normalizeSiteUrl } from "@/shared/lib/url";

const DEFAULT_DEV_ADMIN_NAME = "Admin";
const DEFAULT_DEV_ADMIN_USERNAME = "admin";
const DEFAULT_DEV_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_DEV_ADMIN_PASSWORD = "admin123456";

type DefaultAdminCredentials = {
  name: string;
  username: string;
  email: string;
  password: string;
};

type DefaultAdminUserSnapshot = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
};

function normalizeAdminUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAdminEmail(value: string) {
  return value.trim().toLowerCase();
}

function slugifyAdminUsername(value: string) {
  const normalized = value.trim().toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return slug || DEFAULT_DEV_ADMIN_USERNAME;
}

export function getDefaultAdminCredentials(): DefaultAdminCredentials {
  const username = normalizeAdminUsername(
    process.env.SEED_ADMIN_USERNAME?.trim() || DEFAULT_DEV_ADMIN_USERNAME,
  );

  return {
    name: process.env.SEED_ADMIN_NAME?.trim() || DEFAULT_DEV_ADMIN_NAME,
    username,
    email: normalizeAdminEmail(
      process.env.SEED_ADMIN_EMAIL?.trim() || `${username}@example.com`,
    ),
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

async function findDefaultAdminUser(
  credentials: DefaultAdminCredentials,
): Promise<DefaultAdminUserSnapshot | null> {
  const existingByUsername = await db.user.findFirst({
    where: { username: credentials.username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  });

  if (existingByUsername) {
    return existingByUsername;
  }

  return db.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
    },
  });
}

export async function backfillAdminUsername(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
    },
  });

  if (!user || user.role !== "admin" || user.username) {
    return null;
  }

  const baseUsername = slugifyAdminUsername(user.name);
  let nextUsername = baseUsername;
  let suffix = 2;

  while (true) {
    const exists = await db.user.findFirst({
      where: {
        username: nextUsername,
        id: { not: user.id },
      },
      select: { id: true },
    });

    if (!exists) {
      break;
    }

    nextUsername = `${baseUsername.slice(0, Math.max(1, 32 - String(suffix).length - 1))}-${suffix}`;
    suffix += 1;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      username: nextUsername,
      displayUsername: nextUsername,
    },
  });

  return nextUsername;
}

async function getCredentialAccount(userId: string) {
  return db.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
    select: {
      id: true,
      password: true,
    },
  });
}

async function isCredentialPasswordMatching(
  passwordHash: string | null | undefined,
  rawPassword: string,
) {
  if (!passwordHash) {
    return false;
  }

  try {
    return await verifyPassword({
      hash: passwordHash,
      password: rawPassword,
    });
  } catch {
    return false;
  }
}

export async function ensureDefaultAdminUser() {
  return syncDefaultAdminUser({ onlyWhenEmpty: true });
}

export async function getDefaultAdminLoginHint() {
  const credentials = getDefaultAdminCredentials();
  const existingUser = await findDefaultAdminUser(credentials);

  if (!existingUser || existingUser.role !== "admin") {
    return null;
  }

  const existingCredentialAccount = await getCredentialAccount(existingUser.id);
  const passwordMatches = await isCredentialPasswordMatching(
    existingCredentialAccount?.password,
    credentials.password,
  );

  if (!passwordMatches) {
    return null;
  }

  return credentials;
}

export async function syncDefaultAdminUser(options?: {
  onlyWhenEmpty?: boolean;
}) {
  const credentials = getDefaultAdminCredentials();
  const userCount = await getUserCount();

  if (options?.onlyWhenEmpty && userCount > 0) {
    return credentials;
  }

  const existingUser = await findDefaultAdminUser(credentials);
  const existingCredentialAccount = existingUser
    ? await getCredentialAccount(existingUser.id)
    : null;

  const passwordMatches = await isCredentialPasswordMatching(
    existingCredentialAccount?.password,
    credentials.password,
  );

  if (
    existingUser &&
    existingUser.role === "admin" &&
    existingUser.name === credentials.name &&
    existingUser.username === credentials.username &&
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
          username: credentials.username,
          displayUsername: credentials.username,
          role: "admin",
        },
        select: {
          id: true,
        },
      }));

    if (
      !existingUser ||
      existingUser.role !== "admin" ||
      existingUser.name !== credentials.name ||
      existingUser.username !== credentials.username ||
      existingUser.email !== credentials.email
    ) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: credentials.name,
          username: credentials.username,
          displayUsername: credentials.username,
          email: credentials.email,
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
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      username: true,
    },
  });

  if (!user) {
    return false;
  }

  const defaultAdminHint = await getDefaultAdminLoginHint();

  return (
    !!defaultAdminHint &&
    user.role === "admin" &&
    user.username === defaultAdminHint.username
  );
}

export async function needsSiteBasicSetup() {
  const settings = await db.siteSetting.findFirst({
    select: {
      siteTitle: true,
    },
  });

  if (!settings) {
    return true;
  }

  return settings.siteTitle.trim() === siteConfig.name;
}
