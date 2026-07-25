import { getAdminSettingsPageData } from "@/features/settings/queries/settings.queries";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const pageData = await getAdminSettingsPageData();
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">站点设置</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            管理站点信息、社交链接与 AI / BYOK 配置
          </p>
        </div>
        <SettingsForm
          settings={pageData.settings}
          showSetupNotice={pageData.showSetupNotice}
        />
      </div>
    </div>
  );
}
