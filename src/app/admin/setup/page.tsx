import { redirect } from "next/navigation";
import { AdminSetupForm } from "@/components/admin/admin-setup-form";
import {
  shouldCreateDefaultAdminOnSetup,
  shouldRenderManualAdminSetup,
  shouldRunAdminSetup,
} from "@/infrastructure/auth/admin-entry";
import { resolveAdminBootstrapMode } from "@/infrastructure/auth/bootstrap-mode";
import { ensureDefaultAdminUser } from "@/infrastructure/auth/bootstrap";
import { isBootstrapAllowed } from "@/infrastructure/auth/bootstrap";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminSetupPage() {
  const bootstrapMode = resolveAdminBootstrapMode({
    bootstrapAllowed: await isBootstrapAllowed(),
  });

  if (!shouldRunAdminSetup({
    bootstrapMode,
  })) {
    redirect("/admin/login");
  }

  if (shouldCreateDefaultAdminOnSetup({ bootstrapMode })) {
    await ensureDefaultAdminUser();
    redirect("/admin/login");
  }

  if (shouldRenderManualAdminSetup({ bootstrapMode })) {
    return (
      <AdminSetupForm
        requireSetupToken={bootstrapMode.requiresSetupToken}
      />
    );
  }

  redirect("/admin/login");
}
