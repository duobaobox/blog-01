import * as settingsRepo from "@/features/settings/repositories/settings.repository";
import type { AccountProfileInput } from "@/features/settings/lib/account-write";
import { needsSiteBasicSetupFromTitle } from "@/features/settings/lib/site-setup";
import {
  resolveSiteSettingsInput,
  type SiteSettingsWriteInput,
} from "@/features/settings/lib/settings-write";

type SiteSettingsRepository = Pick<
  typeof settingsRepo,
  "findSiteSettings" | "upsertSiteSettings"
>;

export function createUpdateSiteSettingsService(
  repo: SiteSettingsRepository = settingsRepo,
) {
  return async function updateSiteSettings(input: SiteSettingsWriteInput) {
    const existingSettings = await repo.findSiteSettings();

    await repo.upsertSiteSettings(
      resolveSiteSettingsInput(input, {
        fallbackSiteUrl: existingSettings?.siteUrl ?? null,
      }),
    );
  };
}

export const updateSiteSettings = createUpdateSiteSettingsService();

export async function updateAdminProfile(input: AccountProfileInput & {
  userId: string;
}) {
  await settingsRepo.updateAdminProfile(input.userId, {
    name: input.name,
  });

  return {
    name: input.name,
  };
}

export async function needsSiteBasicSetup() {
  const settings = await settingsRepo.findSiteSettingsSummary();
  return needsSiteBasicSetupFromTitle(settings?.siteTitle);
}
