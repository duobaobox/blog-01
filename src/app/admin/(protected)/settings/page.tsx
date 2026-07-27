import { AdminPage } from "@/components/admin/admin-page";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettingsPageData } from "@/features/settings/queries/settings.queries";

export default async function AdminSettingsPage() {
  const pageData = await getAdminSettingsPageData();

  return (
    <AdminPage title="站点设置" description="管理站点身份、公开信息与媒体资源">
      <SettingsForm
        settings={pageData.settings}
        showSetupNotice={pageData.showSetupNotice}
      />
    </AdminPage>
  );
}
