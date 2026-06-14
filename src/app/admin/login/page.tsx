import { AdminLoginForm } from "@/components/admin/admin-login-form";
import {
  ensureDefaultAdminUser,
  getDefaultAdminLoginHint,
} from "@/infrastructure/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  await ensureDefaultAdminUser();
  const defaultAdminHint = await getDefaultAdminLoginHint();

  return (
    <AdminLoginForm
      defaultUsername={defaultAdminHint?.username}
      defaultPassword={defaultAdminHint?.password}
    />
  );
}
