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
 *   NEXT_PUBLIC_SITE_URL — site URL    (default: http://localhost:3000)
 */

import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123456";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";

async function main() {
  console.log("🌱 Seeding database...");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Admin email: ${ADMIN_EMAIL}`);

  // Create admin user via Better Auth sign-up endpoint
  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  console.log("\n✅ Seed complete!");
  console.log(`\n   Login at: ${BASE_URL}/admin/login`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
