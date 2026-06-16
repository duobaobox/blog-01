import type * as savedViewServiceModule from "@/features/content-space/services/content-space-saved-view.service";
import type { ContentLibraryFilters } from "@/features/content-space/lib/content-space-workspace";

type SavedViewService = Pick<
  typeof savedViewServiceModule,
  "saveSavedContentView" | "deleteSavedContentView"
>;

type SavedViewActionRunnerDeps = {
  savedViewService: SavedViewService;
  revalidateAdminPosts(): void;
};

export function createSavedContentViewActionRunner(
  deps: SavedViewActionRunnerDeps,
) {
  return {
    async saveSavedContentView(input: {
      userId: string;
      name: string;
      filters: ContentLibraryFilters;
    }) {
      const view = await deps.savedViewService.saveSavedContentView(input);
      deps.revalidateAdminPosts();
      return view;
    },

    async deleteSavedContentView(input: {
      userId: string;
      viewId: string;
    }) {
      await deps.savedViewService.deleteSavedContentView(input);
      deps.revalidateAdminPosts();
    },
  };
}
