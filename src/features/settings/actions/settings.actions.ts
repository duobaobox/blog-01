"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminSettings } from "@/infrastructure/cache/admin-cache";
import { revalidatePublicSite } from "@/infrastructure/cache/public-cache";
import { createSettingsActionRunner } from "@/features/settings/actions/settings-action-runner";
import { parseSiteSettingsFormData } from "@/features/settings/lib/settings-write";
import * as settingsService from "@/features/settings/services/settings.service";

const settingsActionRunner = createSettingsActionRunner({
  settingsService,
  revalidateAdminSettings,
  revalidatePublicSite,
});

export async function updateSiteSettings(formData: FormData) {
  await requireAdminSession();
  const input = parseSiteSettingsFormData(formData);

  await settingsActionRunner.updateSiteSettings(input);
}
