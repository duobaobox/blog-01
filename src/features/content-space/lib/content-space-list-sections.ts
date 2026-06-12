import type {
  ContentSpaceEntry,
  WorkspacePostSummary,
} from "./content-space-workspace";

export type ContentSpaceListSectionInput = {
  entry: ContentSpaceEntry;
  posts: WorkspacePostSummary[];
};

export type ContentSpaceListSection = {
  title: string;
  posts: WorkspacePostSummary[];
};

export function buildContentSpaceListSections(
  input: ContentSpaceListSectionInput,
): ContentSpaceListSection[] {
  if (input.entry === "drafts") {
    return [
      {
        title: "优先补全",
        posts: input.posts.filter((post) => post.status !== "published"),
      },
      {
        title: "已发布对照",
        posts: input.posts.filter((post) => post.status === "published"),
      },
    ].filter((section) => section.posts.length > 0);
  }

  if (input.entry === "ready") {
    return [
      {
        title: "待确认后发布",
        posts: input.posts.filter((post) => post.status !== "published"),
      },
      {
        title: "最近已发布",
        posts: input.posts.filter((post) => post.status === "published"),
      },
    ].filter((section) => section.posts.length > 0);
  }

  return [
    {
      title: input.entry === "recent" ? "继续写" : "当前内容",
      posts: input.posts,
    },
  ];
}
