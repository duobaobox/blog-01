import { revalidateAdminPaths } from "@/infrastructure/cache/admin-cache";
import { createMediaActionRunner } from "@/features/media/actions/media-action-runner";
import * as mediaService from "@/features/media/services/media.service";

export const mediaActionRunner = createMediaActionRunner({
  mediaService,
  revalidateAdminPaths,
});
