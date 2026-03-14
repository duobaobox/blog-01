import * as settingsRepo from "@/features/settings/repositories/settings.repository";

export async function getSiteSettings() {
  return settingsRepo.findSiteSettings();
}
