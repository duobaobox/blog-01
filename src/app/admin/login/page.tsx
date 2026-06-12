import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  ensureDevelopmentAdminUser,
  getUserCount,
} from "@/infrastructure/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const userCount = await getUserCount();

  if (userCount === 0) {
    redirect("/admin/setup");
  }

  const developmentAdmin = await ensureDevelopmentAdminUser();

  return (
    <AdminLoginForm
      defaultEmail={developmentAdmin?.email}
      defaultPassword={developmentAdmin?.password}
    />
  );
}
