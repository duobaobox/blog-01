import { redirect } from "next/navigation";
import { ensureDefaultAdminUser } from "@/infrastructure/auth/bootstrap";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminSetupPage() {
  await ensureDefaultAdminUser();
  redirect("/admin/login");
}
