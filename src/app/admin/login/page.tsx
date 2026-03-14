import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { ensureDevelopmentAdminUser } from "@/infrastructure/auth/bootstrap";

export default async function AdminLoginPage() {
  const developmentAdmin = await ensureDevelopmentAdminUser();

  return (
    <AdminLoginForm
      defaultEmail={developmentAdmin?.email}
      defaultPassword={developmentAdmin?.password}
    />
  );
}
