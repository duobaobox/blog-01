import type { SiteSettingsWriteInput } from "@/features/settings/lib/settings-write";
import { buildUpdateSiteSettingsWorkflow } from "@/features/settings/lib/settings-action-workflow";

type SettingsService = {
  updateSiteSettings(input: SiteSettingsWriteInput): Promise<void>;
};

type SettingsActionRunnerDeps = {
  settingsService: SettingsService;
  revalidateAdminSettings(): void;
  revalidatePublicSite(): void;
};

export function createSettingsActionRunner(deps: SettingsActionRunnerDeps) {
  return {
    async updateSiteSettings(input: SiteSettingsWriteInput) {
      await deps.settingsService.updateSiteSettings(input);
      const workflow = buildUpdateSiteSettingsWorkflow();

      if (workflow.revalidateAdminSettings) {
        deps.revalidateAdminSettings();
      }
      if (workflow.revalidatePublicSite) {
        deps.revalidatePublicSite();
      }
    },
  };
}
