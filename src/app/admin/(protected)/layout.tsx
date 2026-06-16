import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminShellPageData } from "@/features/settings/queries/settings.queries";
import { AdminOnboardingBanner } from "@/components/admin/admin-onboarding-banner";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { getAdminShellAuthRedirect } from "./admin-layout-auth";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStorePromise = cookies();
  const pageDataPromise = getAdminShellPageData();

  const cookieStore = await cookieStorePromise;
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  let pageData: Awaited<ReturnType<typeof getAdminShellPageData>>;

  try {
    pageData = await pageDataPromise;
  } catch (error) {
    const redirectTo = getAdminShellAuthRedirect(error);

    if (redirectTo) {
      redirect(redirectTo);
    }

    throw error;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-dvh overflow-hidden">
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <AdminOnboardingBanner
          needsPasswordChange={pageData.shellStatus.security.needsPasswordChange}
          needsSiteSetup={pageData.shellStatus.onboarding.needsSiteSetup}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
