import { unstable_cache } from "next/cache";
import * as aiSettingsRepo from "@/features/ai/repositories/ai-settings.repository";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";

export type AdminAiSettingsPageData = {
  settings: Awaited<ReturnType<typeof aiSettingsRepo.findAiSettingsForAdmin>>;
};

const getAdminAiSettingsCached = unstable_cache(
  () => aiSettingsRepo.findAiSettingsForAdmin(),
  ["admin-ai-settings-safe"],
  {
    revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
    tags: [ADMIN_CACHE_TAGS.settings],
  },
);

export async function getAdminAiSettingsPageData(): Promise<AdminAiSettingsPageData> {
  return {
    settings: await getAdminAiSettingsCached(),
  };
}
