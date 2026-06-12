import { redirect } from "next/navigation";
import { getUserCount } from "@/infrastructure/auth/bootstrap";
import { AdminSetupForm } from "@/components/admin/admin-setup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminSetupPage() {
  const userCount = await getUserCount();

  if (userCount > 0) {
    redirect("/admin/login");
  }

  return <AdminSetupForm />;
}
