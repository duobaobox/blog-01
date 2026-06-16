import type * as folderServiceModule from "@/features/content-space/services/folder.service";
import type { FolderWriteInput } from "@/features/content-space/lib/folder-write";

type FolderService = Pick<
  typeof folderServiceModule,
  "createFolder" | "renameFolder" | "deleteFolder"
>;

type FolderActionRunnerDeps = {
  folderService: FolderService;
  revalidateAdminPosts(): void;
};

export function createFolderActionRunner(deps: FolderActionRunnerDeps) {
  return {
    async createFolder(input: FolderWriteInput) {
      const folder = await deps.folderService.createFolder(input);
      deps.revalidateAdminPosts();
      return folder;
    },

    async renameFolder(id: string, input: FolderWriteInput) {
      const folder = await deps.folderService.renameFolder(id, input);
      deps.revalidateAdminPosts();
      return folder;
    },

    async deleteFolder(id: string) {
      await deps.folderService.deleteFolder(id);
      deps.revalidateAdminPosts();
    },
  };
}
