"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminSettings } from "@/infrastructure/cache/admin-cache";
import { parseAiSettingsFormData } from "@/features/ai/lib/ai-settings-write";
import * as aiSettingsService from "@/features/ai/services/ai-settings.service";

export async function updateAiSettings(formData: FormData) {
  await requireAdminSession();
  const input = parseAiSettingsFormData(formData);

  await aiSettingsService.updateAiSettings(input);
  revalidateAdminSettings();
}
