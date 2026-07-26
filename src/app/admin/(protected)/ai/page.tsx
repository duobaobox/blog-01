import { getAdminAiSettingsPageData } from "@/features/ai/queries/ai-settings.queries";
import { AiSettingsForm } from "@/components/admin/ai-settings-form";

export default async function AdminAiPage() {
  const pageData = await getAdminAiSettingsPageData();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1680px] p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">AI 设置</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            管理 AI 辅助功能、模型服务商与 BYOK API Key
          </p>
        </div>
        <AiSettingsForm settings={pageData.settings} />
      </div>
    </div>
  );
}
