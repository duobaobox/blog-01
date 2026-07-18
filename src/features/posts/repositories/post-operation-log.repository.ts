import { Prisma } from "@/generated/prisma/client";
import { db } from "@/infrastructure/db";
import {
  USER_INITIATED_POST_OPERATION_TYPES,
  type PostOperationLogDetail,
  type PostOperationType,
} from "@/features/posts/lib/post-operation-log";

export async function createPostOperationLog(data: {
  operation: PostOperationType;
  summary: string;
  detail: PostOperationLogDetail;
  createdBy: string;
  postId?: string | null;
}) {
  return db.postOperationLog.create({
    data: {
      operation: data.operation,
      summary: data.summary,
      detail: data.detail as Prisma.InputJsonValue,
      createdBy: data.createdBy,
      postId: data.postId ?? null,
    },
  });
}

export async function findRecentPostOperationLogs(take = 12) {
  return db.postOperationLog.findMany({
    where: {
      operation: {
        in: [...USER_INITIATED_POST_OPERATION_TYPES],
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take,
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
    },
  });
}
