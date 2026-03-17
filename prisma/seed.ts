/**
 * Seed script: creates the initial admin user via Better Auth signup API.
 *
 * Usage:
 *   1. Make sure your database is running and DATABASE_URL is set in .env
 *   2. Run `npx prisma db push` to sync the schema
 *   3. Start the dev server: `npm run dev`
 *   4. In another terminal: `npx tsx prisma/seed.ts`
 *
 * Environment variables (from .env):
 *   SEED_ADMIN_EMAIL    — admin email  (default: admin@example.com)
 *   SEED_ADMIN_PASSWORD — admin pass   (default: admin123456)
 *   SEED_ADMIN_NAME     — admin name   (default: Admin)
 *   SITE_URL           — site URL    (default: http://localhost:3000)
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const BASE_URL = process.env.SITE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123456";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";
const ADMIN_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Admin email: ${ADMIN_EMAIL}`);

  const existingUser = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (existingUser?.role === "admin") {
    console.log("   Admin user already exists, skipping.");
    return;
  }

  // Create admin user via Better Auth sign-up endpoint
  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
      ...(ADMIN_SETUP_TOKEN
        ? { "x-admin-setup-token": ADMIN_SETUP_TOKEN }
        : {}),
    },
    body: JSON.stringify({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!signUpRes.ok) {
    const body = await signUpRes.text();
    // If user already exists, that's fine
    if (
      body.includes("already") ||
      body.includes("exists") ||
      signUpRes.status === 422
    ) {
      console.log("   Admin user already exists, skipping.");
    } else {
      console.error(
        `   Failed to create admin user: ${signUpRes.status} ${body}`,
      );
      process.exit(1);
    }
  } else {
    console.log("   Admin user created successfully.");
  }

  const createdUser = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (createdUser && createdUser.role !== "admin") {
    await db.user.update({
      where: { id: createdUser.id },
      data: { role: "admin" },
    });
    console.log("   Promoted seeded user to admin.");
  }

  console.log("\n✅ Seed complete!");
  console.log(`\n   Login at: ${BASE_URL}/admin/login`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
