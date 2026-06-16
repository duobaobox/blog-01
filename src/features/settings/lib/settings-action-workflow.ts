export type SettingsActionWorkflowResult = {
  revalidateAdminSettings: boolean;
  revalidatePublicSite: boolean;
};

export function buildUpdateSiteSettingsWorkflow(): SettingsActionWorkflowResult {
  return {
    revalidateAdminSettings: true,
    revalidatePublicSite: true,
  };
}
