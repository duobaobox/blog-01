import type {
  ContentSpaceEntry,
  WorkspacePostSummary,
} from "./content-space-workspace";
import { UNTITLED_POST_TITLE, getPostDisplayTitle } from "@/features/posts/lib/post-title";

export type ContentSpaceListSectionInput = {
  entry: ContentSpaceEntry;
  posts: WorkspacePostSummary[];
};

export type ContentSpaceListSection = {
  title: string;
  posts: WorkspacePostSummary[];
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function buildContentSpaceListSections(
  input: ContentSpaceListSectionInput,
): ContentSpaceListSection[] {
  if (input.entry === "drafts") {
    return [
      {
        title: "待补标题",
        posts: input.posts.filter(
          (post) => getPostDisplayTitle(post.title) === UNTITLED_POST_TITLE,
        ),
      },
      {
        title: "待补摘要",
        posts: input.posts.filter(
          (post) =>
            getPostDisplayTitle(post.title) !== UNTITLED_POST_TITLE &&
            !hasText(post.excerpt),
        ),
      },
      {
        title: "继续扩写",
        posts: input.posts.filter(
          (post) =>
            getPostDisplayTitle(post.title) !== UNTITLED_POST_TITLE &&
            hasText(post.excerpt),
        ),
      },
    ].filter((section) => section.posts.length > 0);
  }

  if (input.entry === "ready") {
    return [
      {
        title: "待补封面",
        posts: input.posts.filter(
          (post) => hasText(post.excerpt) && !hasText(post.coverImageUrl),
        ),
      },
      {
        title: "待补 SEO",
        posts: input.posts.filter(
          (post) =>
            hasText(post.excerpt) &&
            hasText(post.coverImageUrl) &&
            (!hasText(post.seoTitle) || !hasText(post.seoDescription)),
        ),
      },
      {
        title: "可以发布",
        posts: input.posts.filter(
          (post) =>
            hasText(post.excerpt) &&
            hasText(post.coverImageUrl) &&
            hasText(post.seoTitle) &&
            hasText(post.seoDescription),
        ),
      },
    ].filter((section) => section.posts.length > 0);
  }

  if (input.entry === "topic" || input.entry === "subtopic") {
    return [
      {
        title: "待完善草稿",
        posts: input.posts.filter((post) => post.status !== "published"),
      },
      {
        title: "已发布基线",
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
