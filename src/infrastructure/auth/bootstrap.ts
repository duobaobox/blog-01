import { db } from "@/infrastructure/db";

export async function isBootstrapAllowed(setupToken?: string | null) {
  const userCount = await db.user.count();

  if (userCount > 0) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  return Boolean(expectedToken && setupToken === expectedToken);
}

export async function promoteToAdmin(email: string) {
  await db.user.updateMany({
    where: { email, role: { not: "admin" } },
    data: { role: "admin" },
  });
}
