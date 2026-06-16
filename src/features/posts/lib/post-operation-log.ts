import type { PostBulkActionInput } from "@/features/posts/lib/post-bulk-action";

export const POST_OPERATION_TYPES = [
  "create",
  "update",
  "archive",
  "bulkStatus",
  "bulkCategory",
  "bulkFolder",
  "bulkReplaceTags",
  "bulkAppendTags",
  "bulkRemoveTags",
] as const;

export type PostOperationType = (typeof POST_OPERATION_TYPES)[number];

export type PostOperationLogDetail = {
  postIds: string[];
  status?: string | null;
  categoryId?: string | null;
  folderId?: string | null;
  tagIds?: string[];
  count: number;
};

export type PostOperationLogEntry = {
  id: string;
  operation: PostOperationType;
  summary: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  author?: {
    id: string;
    name: string;
    username: string | null;
    email: string;
  } | null;
  detail: PostOperationLogDetail;
};

export function getPostBulkOperationType(
  input: PostBulkActionInput,
): Extract<
  PostOperationType,
  "bulkStatus" | "bulkCategory" | "bulkFolder" | "bulkReplaceTags" | "bulkAppendTags" | "bulkRemoveTags"
> {
  switch (input.type) {
    case "setStatus":
      return "bulkStatus";
    case "setCategory":
      return "bulkCategory";
    case "setFolder":
      return "bulkFolder";
    case "replaceTags":
      return "bulkReplaceTags";
    case "appendTags":
      return "bulkAppendTags";
    case "removeTags":
      return "bulkRemoveTags";
  }
}

export function buildPostOperationSummary(input:
  | {
      type: "create" | "update" | "archive";
      title: string;
    }
  | {
      type: ReturnType<typeof getPostBulkOperationType>;
      count: number;
    }) {
  switch (input.type) {
    case "create":
      return `创建文章《${input.title}》`;
    case "update":
      return `更新文章《${input.title}》`;
    case "archive":
      return `归档文章《${input.title}》`;
    case "bulkStatus":
      return `批量修改 ${input.count} 篇文章状态`;
    case "bulkCategory":
      return `批量调整 ${input.count} 篇文章分类`;
    case "bulkFolder":
      return `批量调整 ${input.count} 篇文章文件夹`;
    case "bulkReplaceTags":
      return `批量替换 ${input.count} 篇文章标签`;
    case "bulkAppendTags":
      return `批量追加 ${input.count} 篇文章标签`;
    case "bulkRemoveTags":
      return `批量移除 ${input.count} 篇文章标签`;
  }
}
