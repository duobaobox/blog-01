import type * as mediaServiceModule from "@/features/media/services/media.service";
import {
  buildDeleteMediaWorkflow,
  buildReplaceMediaWorkflow,
  buildUpdateMediaAltWorkflow,
  buildUploadMediaWorkflow,
} from "@/features/media/lib/media-action-workflow";

type MediaService = Pick<
  typeof mediaServiceModule,
  "uploadFile" | "deleteFile" | "updateMediaAlt" | "replaceFile"
>;

type MediaActionRunnerDeps = {
  mediaService: MediaService;
  revalidateAdminPaths(paths: string[]): void;
};

export function createMediaActionRunner(deps: MediaActionRunnerDeps) {
  return {
    async uploadMedia(file: File) {
      const media = await deps.mediaService.uploadFile(file);
      const workflow = buildUploadMediaWorkflow();
      deps.revalidateAdminPaths(workflow.adminPaths);
      return media;
    },

    async deleteMedia(id: string) {
      await deps.mediaService.deleteFile(id);
      const workflow = buildDeleteMediaWorkflow();
      deps.revalidateAdminPaths(workflow.adminPaths);
    },

    async updateMediaAlt(id: string, alt: string) {
      const media = await deps.mediaService.updateMediaAlt(id, alt);
      const workflow = buildUpdateMediaAltWorkflow();
      deps.revalidateAdminPaths(workflow.adminPaths);
      return media;
    },

    async replaceMedia(id: string, file: File) {
      const media = await deps.mediaService.replaceFile(id, file);
      const workflow = buildReplaceMediaWorkflow();
      deps.revalidateAdminPaths(workflow.adminPaths);
      return media;
    },
  };
}
