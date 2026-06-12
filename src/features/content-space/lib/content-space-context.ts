import type { ContentSpaceEntry } from "./content-space-workspace";
import type { WorkspacePostSummary } from "./content-space-workspace";

export type ContentContextInput = {
  entry: ContentSpaceEntry;
  topicName?: string;
  subtopicName?: string;
  searchQuery: string;
  posts: WorkspacePostSummary[];
};

export type ContentContextSummary = {
  contextLabel: string;
  hint: string;
  totalCount: number;
  draftCount: number;
  publishedCount: number;
  empty: boolean;
};

function getContextLabel(input: ContentContextInput) {
  if (input.entry === "drafts") return "草稿箱";
  if (input.entry === "ready") return "待发布";
  if (input.entry === "topic") return input.topicName ?? "专题";
  if (input.entry === "subtopic") return input.subtopicName ?? "子专题";
  if (input.entry === "search") return "搜索结果";
  return "最近编辑";
}

function getHint(input: ContentContextInput) {
  if (input.entry === "search") {
    return input.searchQuery ? `关键词：${input.searchQuery}` : "按关键词筛内容";
  }

  if (input.entry === "drafts") {
    return "优先处理还在打磨中的文章";
  }

  if (input.entry === "ready") {
    return "适合做发布前检查和最终确认";
  }

  if (input.entry === "topic" && input.topicName) {
    return `围绕 ${input.topicName} 统一整理内容结构`;
  }

  if (input.entry === "subtopic" && input.subtopicName) {
    return `聚焦 ${input.subtopicName} 这一条写作分支`;
  }

  return "从最近动过的内容继续，减少上下文切换";
}

export function buildContentContextSummary(
  input: ContentContextInput,
): ContentContextSummary {
  const draftCount = input.posts.filter((post) => post.status !== "published").length;
  const publishedCount = input.posts.filter(
    (post) => post.status === "published",
  ).length;

  return {
    contextLabel: getContextLabel(input),
    hint: getHint(input),
    totalCount: input.posts.length,
    draftCount,
    publishedCount,
    empty: input.posts.length === 0,
  };
}
