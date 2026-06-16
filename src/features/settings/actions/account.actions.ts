"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminAccount } from "@/infrastructure/cache/admin-cache";
import { createAccountActionRunner } from "@/features/settings/actions/account-action-runner";
import { parseAccountProfileInput } from "@/features/settings/lib/account-write";
import * as settingsService from "@/features/settings/services/settings.service";

const accountActionRunner = createAccountActionRunner({
  settingsService,
  revalidateAdminAccount,
});

export async function updateAdminProfile(input: { name: string }) {
  const session = await requireAdminSession();
  const parsedInput = parseAccountProfileInput(input);

  return accountActionRunner.updateAdminProfile({
    ...parsedInput,
    userId: session.user.id,
  });
}
