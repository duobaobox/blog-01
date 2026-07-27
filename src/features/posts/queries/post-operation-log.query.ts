import { unstable_cache } from "next/cache";
import {
  ADMIN_CACHE_REVALIDATE_SECONDS,
  ADMIN_CACHE_TAGS,
} from "@/infrastructure/cache/admin-cache";
import {
  type PostOperationLogEntry,
  type PostOperationLogDetail,
} from "@/features/posts/lib/post-operation-log";
import * as postOperationLogRepo from "@/features/posts/repositories/post-operation-log.repository";

function normalizeDetail(value: unknown): PostOperationLogDetail {
  if (!value || typeof value !== "object") {
    return {
      postIds: [],
      count: 0,
    };
  }

  const detail = value as Record<string, unknown>;
  return {
    postIds: Array.isArray(detail.postIds)
      ? detail.postIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    status:
      typeof detail.status === "string" || detail.status === null
        ? (detail.status as string | null)
        : undefined,
    categoryId:
      typeof detail.categoryId === "string" || detail.categoryId === null
        ? (detail.categoryId as string | null)
        : undefined,
    folderId:
      typeof detail.folderId === "string" || detail.folderId === null
        ? (detail.folderId as string | null)
        : undefined,
    tagIds: Array.isArray(detail.tagIds)
      ? detail.tagIds.filter((item): item is string => typeof item === "string")
      : undefined,
    count: typeof detail.count === "number" ? detail.count : 0,
  };
}

export async function getRecentPostOperationLogs(
  take = 12,
): Promise<PostOperationLogEntry[]> {
  if (take === 8 || take === 12) {
    return getRecentPostOperationLogsCached(take);
  }

  const logs = await postOperationLogRepo.findRecentPostOperationLogs(take);
  return mapRecentPostOperationLogs(logs);
}

function mapRecentPostOperationLogs(
  logs: Awaited<
    ReturnType<typeof postOperationLogRepo.findRecentPostOperationLogs>
  >,
) {
  return logs.map((log) => ({
    id: log.id,
    operation: log.operation as PostOperationLogEntry["operation"],
    summary: log.summary,
    createdAt: log.createdAt.toISOString(),
    post: log.post
      ? {
          id: log.post.id,
          title: log.post.title,
          slug: log.post.slug,
        }
      : null,
    author: log.author
      ? {
          id: log.author.id,
          name: log.author.name,
          username: log.author.username,
          email: log.author.email,
        }
      : null,
    detail: normalizeDetail(log.detail),
  }));
}

let getRecentPostOperationLogsCachedQuery:
  ((take: number) => Promise<PostOperationLogEntry[]>) | null = null;

function getRecentPostOperationLogsCached(take: number) {
  getRecentPostOperationLogsCachedQuery ??= unstable_cache(
    async (cachedTake: number) => {
      const logs =
        await postOperationLogRepo.findRecentPostOperationLogs(cachedTake);
      return mapRecentPostOperationLogs(logs);
    },
    ["recent-post-operation-logs"],
    {
      revalidate: ADMIN_CACHE_REVALIDATE_SECONDS,
      tags: [ADMIN_CACHE_TAGS.dashboard],
    },
  );

  return getRecentPostOperationLogsCachedQuery(take);
}
