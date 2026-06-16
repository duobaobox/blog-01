import type { ContentSpaceEntry, WorkspacePostSummary } from "./content-space-workspace";
import { getPostGovernanceDebtDefinition } from "@/features/posts/lib/post-governance";
import type { PostGovernanceDebtKey } from "@/features/posts/lib/post-governance";

export type ContentSpaceViewModelInput = {
  entry: ContentSpaceEntry;
  posts: WorkspacePostSummary[];
  debt?: PostGovernanceDebtKey;
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
  if (input.entry === "library") {
    const debtDefinition = input.debt
      ? getPostGovernanceDebtDefinition(input.debt)
      : undefined;

    return {
      sectionTitle: debtDefinition?.label ?? "全部内容",
      emphasis: debtDefinition?.emphasis ?? "从完整内容库里整理历史文章和结构",
      emptyTitle: debtDefinition?.emptyTitle ?? "还没有任何内容",
      showContextHint: false,
      showContextPath: false,
    };
  }

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
    sectionTitle: "最近更新",
    emphasis: "先处理最新变动，再进入具体结构",
    emptyTitle: "还没有最近内容",
    showContextHint: false,
    showContextPath: false,
  };
}
