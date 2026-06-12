import type { ContentSpaceEntry, WorkspacePostSummary } from "./content-space-workspace";

export type ContentSpaceViewModelInput = {
  entry: ContentSpaceEntry;
  posts: WorkspacePostSummary[];
};

export type ContentSpaceViewModel = {
  sectionTitle: string;
  emphasis: string;
  emptyTitle: string;
  workflowLabel?: string;
};

export function buildContentSpaceViewModel(
  input: ContentSpaceViewModelInput,
): ContentSpaceViewModel {
  if (input.entry === "drafts") {
    return {
      sectionTitle: "草稿整理",
      emphasis: "优先补全未完成内容",
      emptyTitle: "还没有草稿",
      workflowLabel: "当前写作焦点",
    };
  }

  if (input.entry === "ready") {
    return {
      sectionTitle: "发布前检查",
      emphasis: "适合做最后确认",
      emptyTitle: "还没有待发布内容",
      workflowLabel: "发布前检查",
    };
  }

  if (input.entry === "search") {
    return {
      sectionTitle: "搜索结果",
      emphasis: "快速比对关键词命中内容",
      emptyTitle: "没有搜索到相关内容",
    };
  }

  if (input.entry === "topic") {
    return {
      sectionTitle: "专题内容",
      emphasis: "从专题层面整理内容结构",
      emptyTitle: "这个专题下还没有内容",
      workflowLabel: "专题进度",
    };
  }

  if (input.entry === "subtopic") {
    return {
      sectionTitle: "子专题内容",
      emphasis: "沿着同一分支连续写作",
      emptyTitle: "这个子专题下还没有内容",
      workflowLabel: "分支进度",
    };
  }

  return {
    sectionTitle: "最近编辑",
    emphasis: "继续上次工作",
    emptyTitle: "还没有最近内容",
  };
}
