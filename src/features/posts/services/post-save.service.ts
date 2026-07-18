import { materializePostContent } from "@/features/editor/content-materializer";
import {
  buildPostMediaReferenceInputs,
  collectCandidateMediaUrls,
} from "@/features/media/lib/post-media-reference";
import * as mediaRepo from "@/features/media/repositories/media.repository";
import { buildPostOperationSummary } from "@/features/posts/lib/post-operation-log";
import { requirePublishablePost } from "@/features/posts/lib/post-publishability";
import {
  areMediaReferenceSetsEqual,
  areStringSetsEqual,
  hasPostContentChanged,
  shouldLogPostUpdate,
} from "@/features/posts/lib/post-save-plan";
import { isPublishedPost, isReviewPost } from "@/features/posts/lib/post-status";
import type { PostStatus, PostWriteInput } from "@/features/posts/lib/post-write";
import * as postOperationLogRepo from "@/features/posts/repositories/post-operation-log.repository";
import * as postSaveRepo from "@/features/posts/repositories/post-save.repository";
import { NotFoundError } from "@/shared/lib/app-error";

function requiresPublishableStatus(status: PostStatus) {
  return isReviewPost({ status }) || isPublishedPost({ status });
}

async function resolvePostMediaReferences(input: {
  coverImageUrl: string | null;
  contentJson: unknown;
}) {
  const mediaRecords = await mediaRepo.findMediaByUrls(
    collectCandidateMediaUrls(input),
  );

  return buildPostMediaReferenceInputs(input, mediaRecords);
}

function normalizeStoredMediaReferences(
  references: Array<{ mediaId: string; usage: string }>,
) {
  return references.map((reference) => ({
    mediaId: reference.mediaId,
    usage: reference.usage === "cover" ? ("cover" as const) : ("content" as const),
  }));
}

export async function updatePostIncrementally(
  id: string,
  input: PostWriteInput & {
    updatedBy: string;
  },
) {
  const existingPost = await postSaveRepo.findPostSaveState(id);
  if (!existingPost) {
    throw new NotFoundError("文章不存在");
  }

  if (requiresPublishableStatus(input.status)) {
    requirePublishablePost({
      title: input.title,
      contentJson: input.contentJson,
    });
  }

  const contentChanged = hasPostContentChanged(
    existingPost.contentJson,
    input.contentJson,
  );
  const materialized = contentChanged
    ? await materializePostContent(input.contentJson)
    : null;
  const persistedContentJson = materialized?.contentJson ?? existingPost.contentJson;

  const coverChanged = existingPost.coverImageUrl !== input.coverImageUrl;
  const currentMediaReferences = normalizeStoredMediaReferences(
    existingPost.mediaReferences,
  );
  const nextMediaReferences =
    contentChanged || coverChanged
      ? await resolvePostMediaReferences({
          coverImageUrl: input.coverImageUrl,
          contentJson: persistedContentJson,
        })
      : currentMediaReferences;

  const existingTagIds = existingPost.tags.map((item) => item.tag.id);
  const tagsChanged = !areStringSetsEqual(existingTagIds, input.tagIds);
  const mediaReferencesChanged = !areMediaReferenceSetsEqual(
    currentMediaReferences,
    nextMediaReferences,
  );

  let publishedAt = null;
  if (isPublishedPost(input)) {
    publishedAt = existingPost.publishedAt || null;
  }
  if (isPublishedPost(input) && !publishedAt) {
    publishedAt = new Date();
  }

  const post = await postSaveRepo.updatePostIncrementally(id, {
    title: input.title,
    slug: existingPost.slug,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    folderId: input.folderId || null,
    status: input.status,
    publishedAt,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    isFeatured: input.isFeatured,
    contentUpdate: materialized
      ? {
          contentJson: materialized.contentJson,
          contentHtml: materialized.contentHtml,
          contentText: materialized.contentText,
          contentToc: materialized.contentToc,
          readingTimeMinutes: materialized.readingTimeMinutes,
          wordCount: materialized.wordCount,
        }
      : undefined,
    tagIds: input.tagIds,
    syncTags: tagsChanged,
    mediaReferences: nextMediaReferences,
    syncMediaReferences: mediaReferencesChanged,
  });

  if (
    shouldLogPostUpdate({
      saveIntent: input.saveIntent,
      previousStatus: existingPost.status,
      nextStatus: post.status,
    })
  ) {
    const operation = input.saveIntent === "publish" ? "publish" : "save";

    await postOperationLogRepo.createPostOperationLog({
      operation,
      summary: buildPostOperationSummary({
        type: operation,
        title: post.title,
      }),
      detail: {
        postIds: [post.id],
        count: 1,
        status: post.status,
        categoryId: post.category?.id ?? null,
        folderId: post.folderId ?? null,
        tagIds: post.tags.map((item) => item.tag.id),
      },
      createdBy: input.updatedBy,
      postId: post.id,
    });
  }

  return {
    previousPost: existingPost,
    post,
  };
}
