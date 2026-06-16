import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { shouldRedirectLoginToSetup } from "@/infrastructure/auth/admin-entry";
import {
  resolveAdminBootstrapMode,
  shouldAllowDefaultAdminLoginHint,
} from "@/infrastructure/auth/bootstrap-mode";
import {
  isBootstrapAllowed,
  getDefaultAdminLoginHint,
} from "@/infrastructure/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const bootstrapMode = resolveAdminBootstrapMode({
    bootstrapAllowed: await isBootstrapAllowed(),
  });

  if (shouldRedirectLoginToSetup({
    bootstrapMode,
  })) {
    redirect("/admin/setup");
  }

  const defaultAdminHint = shouldAllowDefaultAdminLoginHint({})
    ? await getDefaultAdminLoginHint()
    : null;

  return (
    <AdminLoginForm
      defaultUsername={defaultAdminHint?.username}
      defaultPassword={defaultAdminHint?.password}
    />
  );
}
