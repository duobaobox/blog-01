import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  ensureDefaultAdminUser,
} from "@/infrastructure/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const defaultAdmin = await ensureDefaultAdminUser();

  return (
    <AdminLoginForm
      defaultEmail={defaultAdmin?.email}
      defaultPassword={defaultAdmin?.password}
    />
  );
}
