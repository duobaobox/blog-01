import { AdminPage } from "@/components/admin/admin-page";
import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { getAdminAiSettingsPageData } from "@/features/ai/queries/ai-settings.queries";

export default async function AdminAiPage() {
  const pageData = await getAdminAiSettingsPageData();

  return (
    <AdminPage
      title="AI 设置"
      description="管理模型服务商、连接地址与 BYOK API Key"
    >
      <AiSettingsForm settings={pageData.settings} />
    </AdminPage>
  );
}
