import type { ContentSpaceEntry, WorkspacePostSummary } from "./content-space-workspace";

export type ContentSpaceViewModelInput = {
  entry: ContentSpaceEntry;
  posts: WorkspacePostSummary[];
};

export type ContentSpaceViewModel = {
  sectionTitle: string;
  emphasis: string;
  emptyTitle: string;
  showContextHint: boolean;
  showContextPath: boolean;
};

export function buildContentSpaceViewModel(
  input: ContentSpaceViewModelInput,
): ContentSpaceViewModel {
  if (input.entry === "drafts") {
    return {
      sectionTitle: "草稿",
      emphasis: "优先补全未完成内容",
      emptyTitle: "还没有草稿",
      showContextHint: false,
      showContextPath: false,
    };
  }

  if (input.entry === "ready") {
    return {
      sectionTitle: "待发布",
      emphasis: "适合做最后确认",
      emptyTitle: "还没有待发布内容",
      showContextHint: false,
      showContextPath: false,
    };
  }

  if (input.entry === "search") {
    return {
      sectionTitle: "搜索结果",
      emphasis: "快速比对关键词命中内容",
      emptyTitle: "换个关键词试试",
      showContextHint: false,
      showContextPath: false,
    };
  }

  if (input.entry === "folder") {
    return {
      sectionTitle: "文件夹内容",
      emphasis: "围绕同一组内容持续整理和写作",
      emptyTitle: "这个文件夹下还没有内容",
      showContextHint: false,
      showContextPath: false,
    };
  }

  return {
    sectionTitle: "全部文章",
    emphasis: "先从全局浏览，再进入具体结构",
    emptyTitle: "还没有文章",
    showContextHint: false,
    showContextPath: false,
  };
}
