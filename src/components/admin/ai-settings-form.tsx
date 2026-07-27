import { AiSettingsBindingForm } from "@/components/admin/ai-settings-binding-form";
import { AiSettingsSummary } from "@/components/admin/ai-settings-summary";
import type { AdminAiSettingsPageData } from "@/features/ai/queries/ai-settings.queries";

type AiSettingsFormProps = {
  settings: AdminAiSettingsPageData["settings"];
};

export function AiSettingsForm({ settings }: AiSettingsFormProps) {
  return (
    <div className="space-y-4">
      <AiSettingsSummary settings={settings} />
      <AiSettingsBindingForm settings={settings} />
    </div>
  );
}
