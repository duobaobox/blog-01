import type { PostBulkActionInput } from "@/features/posts/lib/post-bulk-action";

export const POST_OPERATION_TYPES = [
  "create",
  "save",
  "publish",
  "unpublish",
  "delete",
  "update",
  "bulkStatus",
  "bulkCategory",
  "bulkFolder",
  "bulkReplaceTags",
  "bulkAppendTags",
  "bulkRemoveTags",
] as const;

export type PostOperationType = (typeof POST_OPERATION_TYPES)[number];
export type UserInitiatedPostOperationType = Exclude<
  PostOperationType,
  "update"
>;

export const USER_INITIATED_POST_OPERATION_TYPES =
  POST_OPERATION_TYPES.filter(
    (type): type is UserInitiatedPostOperationType => type !== "update",
  );

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
      type: "create" | "save" | "publish" | "unpublish" | "delete" | "update";
      title: string;
    }
  | {
      type: ReturnType<typeof getPostBulkOperationType>;
      count: number;
    }) {
  switch (input.type) {
    case "create":
      return `创建文章《${input.title}》`;
    case "save":
      return `保存文章《${input.title}》`;
    case "publish":
      return `发布文章《${input.title}》`;
    case "unpublish":
      return `取消发布《${input.title}》`;
    case "delete":
      return `删除文章《${input.title}》`;
    case "update":
      return `更新文章《${input.title}》`;
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

export function getPostSaveOperationType(input: {
  saveIntent?: string;
  previousStatus?: string | null;
  nextStatus: string;
  isNew?: boolean;
}): Extract<
  PostOperationType,
  "create" | "save" | "publish" | "unpublish"
> {
  if (input.saveIntent === "publish") {
    if (
      input.previousStatus === "published" &&
      input.nextStatus !== "published"
    ) {
      return "unpublish";
    }

    if (input.nextStatus === "published") {
      return "publish";
    }
  }

  return input.isNew ? "create" : "save";
}
