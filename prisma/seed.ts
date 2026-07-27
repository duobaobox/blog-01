import "dotenv/config";
import { syncDefaultAdminUser } from "@/infrastructure/auth/bootstrap";

const BASE_URL = process.env.SITE_URL || "http://localhost:3000";

async function main() {
  console.log("🌱 Seeding database...");
  console.log(`   Base URL: ${BASE_URL}`);
  const admin = await syncDefaultAdminUser();
  console.log(`   Admin account: ${admin.username}`);

  console.log("\n✅ Seed complete!");
  console.log(`\n   Login at: ${BASE_URL}/admin/login`);
  console.log(`   Account:  ${admin.username}`);
  console.log(`   Password: ${admin.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
