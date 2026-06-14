import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/infrastructure/auth";
import {
  isDefaultAdminPasswordActive,
  needsSiteBasicSetup,
} from "@/infrastructure/auth/bootstrap";
import { AdminOnboardingBanner } from "@/components/admin/admin-onboarding-banner";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

export const metadata = {
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [showPasswordReminder, showSiteReminder] = await Promise.all([
    isDefaultAdminPasswordActive(session.user.id),
    needsSiteBasicSetup(),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-dvh overflow-hidden">
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <AdminOnboardingBanner
          needsPasswordChange={showPasswordReminder}
          needsSiteSetup={showSiteReminder}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
