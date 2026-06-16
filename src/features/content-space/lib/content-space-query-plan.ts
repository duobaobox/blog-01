export type ContentSpaceQueryPlanInput = {
  query: string;
  requestedEntry?: string;
  requestedFolderId?: string;
  requestedPostId?: string;
};

export type ContentSpaceQueryPlan = {
  pageTarget: "library" | "recent";
  shouldLoadSearchResults: boolean;
  shouldLoadRequestedPostForContext: boolean;
  shouldLoadFolderPostsFromExplicitFolder: boolean;
};

export function buildContentSpaceQueryPlan(
  input: ContentSpaceQueryPlanInput,
): ContentSpaceQueryPlan {
  const normalizedQuery = input.query.trim();
  const hasSearchQuery = normalizedQuery.length > 0;
  const hasExplicitFolder = Boolean(input.requestedFolderId);
  const usesQuickEntryContext =
    input.requestedEntry === "drafts" || input.requestedEntry === "ready";
  const usesExplicitLibraryContext = input.requestedEntry === "library";

  return {
    pageTarget: input.requestedEntry === "recent" ? "recent" : "library",
    shouldLoadSearchResults: hasSearchQuery,
    shouldLoadRequestedPostForContext:
      !hasSearchQuery &&
      !hasExplicitFolder &&
      !usesQuickEntryContext &&
      !usesExplicitLibraryContext &&
      Boolean(input.requestedPostId),
    shouldLoadFolderPostsFromExplicitFolder:
      !hasSearchQuery && hasExplicitFolder,
  };
}
