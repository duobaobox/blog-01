import { siteConfig } from "@/shared/config/site.config";

export function needsSiteBasicSetupFromTitle(siteTitle: string | null | undefined) {
  if (!siteTitle) {
    return true;
  }

  return siteTitle.trim() === siteConfig.name;
}
