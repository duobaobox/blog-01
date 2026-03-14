import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/infrastructure/auth";
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

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
