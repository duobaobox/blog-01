import type * as settingsServiceModule from "@/features/settings/services/settings.service";

type SettingsService = Pick<typeof settingsServiceModule, "updateAdminProfile">;

type AccountActionRunnerDeps = {
  settingsService: SettingsService;
  revalidateAdminAccount(): void;
};

export function createAccountActionRunner(deps: AccountActionRunnerDeps) {
  return {
    async updateAdminProfile(
      input: Parameters<SettingsService["updateAdminProfile"]>[0],
    ) {
      const result = await deps.settingsService.updateAdminProfile(input);
      deps.revalidateAdminAccount();
      return result;
    },
  };
}
