"use server";

import { requireAdminSession } from "@/infrastructure/auth";
import { revalidateAdminPosts } from "@/infrastructure/cache/admin-cache";
import { createSavedContentViewActionRunner } from "@/features/content-space/actions/content-space-saved-view-action-runner";
import { parseSavedContentViewInput } from "@/features/content-space/lib/content-space-saved-view-shared";
import * as savedViewService from "@/features/content-space/services/content-space-saved-view.service";

const savedViewActionRunner = createSavedContentViewActionRunner({
  savedViewService,
  revalidateAdminPosts,
});

export async function saveContentSpaceSavedView(formData: FormData) {
  const session = await requireAdminSession();
  const input = parseSavedContentViewInput(formData);

  return savedViewActionRunner.saveSavedContentView({
    userId: session.user.id,
    name: input.name,
    filters: input.filters,
  });
}

export async function deleteContentSpaceSavedView(viewId: string) {
  const session = await requireAdminSession();

  await savedViewActionRunner.deleteSavedContentView({
    userId: session.user.id,
    viewId,
  });
}
