import type {
  ContentSpaceEntry,
  WorkspacePostSummary,
} from "./content-space-workspace";
import { UNTITLED_POST_TITLE, getPostDisplayTitle } from "@/features/posts/lib/post-title";

export type ContentSpaceWorkflowCard = {
  title: string;
  description: string;
  count: number;
};

export type ContentSpaceWorkflowInput = {
  entry: ContentSpaceEntry;
  posts: WorkspacePostSummary[];
};

export type ContentSpaceWorkflowModel = {
  cards: ContentSpaceWorkflowCard[];
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function countPosts(
  posts: WorkspacePostSummary[],
  predicate: (post: WorkspacePostSummary) => boolean,
) {
  return posts.filter(predicate).length;
}

export function buildContentSpaceWorkflowModel(
  input: ContentSpaceWorkflowInput,
): ContentSpaceWorkflowModel {
  if (input.entry === "drafts") {
    const untitledCount = countPosts(
      input.posts,
      (post) => getPostDisplayTitle(post.title) === UNTITLED_POST_TITLE,
    );
    const missingExcerptCount = countPosts(
      input.posts,
      (post) =>
        getPostDisplayTitle(post.title) !== UNTITLED_POST_TITLE &&
        !hasText(post.excerpt),
    );
    const activeWritingCount = Math.max(
      input.posts.length - untitledCount - missingExcerptCount,
      0,
    );

    return {
      cards: [
        {
          title: "待补标题",
          description: "先把未命名草稿变成可识别主题，后续才方便继续整理。",
          count: untitledCount,
        },
        {
          title: "待补摘要",
          description: "这些草稿已经有主题，但还缺少摘要，发布判断会比较慢。",
          count: missingExcerptCount,
        },
        {
          title: "继续扩写",
          description: "这些草稿已经具备基本信息，适合直接回到正文继续写。",
          count: activeWritingCount,
        },
      ].filter((card) => card.count > 0),
    };
  }

  if (input.entry === "ready") {
    const missingCoverCount = countPosts(
      input.posts,
      (post) =>
        hasText(post.excerpt) &&
        !hasText(post.coverImageUrl),
    );
    const missingSeoCount = countPosts(
      input.posts,
      (post) =>
        hasText(post.excerpt) &&
        hasText(post.coverImageUrl) &&
        (!hasText(post.seoTitle) || !hasText(post.seoDescription)),
    );
    const readyCount = countPosts(
      input.posts,
      (post) =>
        hasText(post.excerpt) &&
        hasText(post.coverImageUrl) &&
        hasText(post.seoTitle) &&
        hasText(post.seoDescription),
    );

    return {
      cards: [
        {
          title: "待补封面",
          description: "这些内容已经接近完成，但还缺少首屏封面信号。",
          count: missingCoverCount,
        },
        {
          title: "待补 SEO",
          description: "正文基本完成，但还没有把搜索摘要和标题整理好。",
          count: missingSeoCount,
        },
        {
          title: "可以发布",
          description: "这些内容信息完整，可以进入最后检查并决定发布时间。",
          count: readyCount,
        },
      ].filter((card) => card.count > 0),
    };
  }

  if (input.entry === "topic" || input.entry === "subtopic") {
    const draftCount = countPosts(
      input.posts,
      (post) => post.status !== "published",
    );
    const publishedCount = input.posts.length - draftCount;

    return {
      cards: [
        {
          title: "待完善草稿",
          description:
            "先补齐这个专题里仍在写作中的内容，避免结构展开后仍有大片空缺。",
          count: draftCount,
        },
        {
          title: "已发布基线",
          description: "这些文章已经公开，适合拿来对照专题是否覆盖完整。",
          count: publishedCount,
        },
      ].filter((card) => card.count > 0),
    };
  }

  return {
    cards: [],
  };
}
