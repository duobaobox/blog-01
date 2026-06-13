import type { ContentSpaceEntry } from "./content-space-workspace";
import type { WorkspacePostSummary } from "./content-space-workspace";

export type ContentContextInput = {
  entry: ContentSpaceEntry;
  folderName?: string;
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
  if (input.entry === "folder") return input.folderName ?? "文件夹";
  if (input.entry === "search") return "搜索结果";
  return "全部文章";
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

  if (input.entry === "folder" && input.folderName) {
    return `围绕 ${input.folderName} 持续整理和写作`;
  }

  return "按统一列表浏览全部内容，再进入具体文件夹细化整理";
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
