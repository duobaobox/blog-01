import { getFolderDeletionPublicPosts } from "@/features/content-space/lib/folder-deletion";
import type { FolderWriteInput } from "@/features/content-space/lib/folder-write";
import type * as folderServiceModule from "@/features/content-space/services/folder.service";

type FolderService = Pick<
  typeof folderServiceModule,
  "createFolder" | "renameFolder" | "deleteFolder"
>;

type FolderActionRunnerDeps = {
  folderService: FolderService;
  revalidateAdminPosts(): void;
  revalidatePostsContent(
    posts: Array<{
      slug?: string | null;
      category?: { slug?: string | null } | null;
      tags?: Array<{ tag?: { slug?: string | null } | null }> | null;
    }>,
  ): void;
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
      const result = await deps.folderService.deleteFolder(id);
      const publicPosts = getFolderDeletionPublicPosts(result.deletedPosts);

      deps.revalidateAdminPosts();
      if (publicPosts.length > 0) {
        deps.revalidatePostsContent(publicPosts);
      }

      return result;
    },
  };
}
