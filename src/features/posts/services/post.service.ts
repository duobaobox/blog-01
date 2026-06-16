import { materializePostContent } from "@/features/editor/content-materializer";
import * as folderRepo from "@/features/content-space/repositories/folder.repository";
import {
  buildPostMediaReferenceInputs,
  collectCandidateMediaUrls,
} from "@/features/media/lib/post-media-reference";
import * as mediaRepo from "@/features/media/repositories/media.repository";
import {
  buildPostOperationSummary,
  getPostBulkOperationType,
} from "@/features/posts/lib/post-operation-log";
import {
  getUntitledPostTitleByIndex,
  UNTITLED_POST_TITLE,
  UNTITLED_POST_TITLE_PREFIX,
} from "@/features/posts/lib/post-title";
import { requirePublishablePost } from "@/features/posts/lib/post-publishability";
import {
  isArchivedPost,
  isPublishedPost,
  isReviewPost,
} from "@/features/posts/lib/post-status";
import type { PostBulkActionInput } from "@/features/posts/lib/post-bulk-action";
import type { PostStatus, PostWriteInput } from "@/features/posts/lib/post-write";
import * as postOperationLogRepo from "@/features/posts/repositories/post-operation-log.repository";
import * as postRepo from "@/features/posts/repositories/post.repository";
import * as categoryRepo from "@/features/taxonomy/repositories/category.repository";
import * as tagRepo from "@/features/taxonomy/repositories/tag.repository";
import { NotFoundError } from "@/shared/lib/app-error";
import { generateSemanticSlug } from "@/shared/lib/slug";

async function resolveSlug(userSlug?: string, title?: string) {
  return generateSemanticSlug(
    async (slug) => Boolean(await postRepo.findAnyPostBySlug(slug)),
    { userSlug, title, prefix: "p" },
  );
}

async function resolveUntitledPostTitle(createdBy: string) {
  const untitledTitles = await postRepo.findUntitledPostTitles(createdBy);
  const usedIndexes = new Set<number>();

  for (const { title } of untitledTitles) {
    if (title === UNTITLED_POST_TITLE) {
      usedIndexes.add(1);
      continue;
    }

    const match = title.match(
      new RegExp(`^${UNTITLED_POST_TITLE_PREFIX} (\\d+)$`),
    );
    if (!match) continue;

    const index = Number.parseInt(match[1] ?? "", 10);
    if (Number.isFinite(index) && index >= 1) {
      usedIndexes.add(index);
    }
  }

  let nextIndex = 1;
  while (usedIndexes.has(nextIndex)) {
    nextIndex += 1;
  }

  return getUntitledPostTitleByIndex(nextIndex);
}

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

export async function createPost(
  input: PostWriteInput & {
    createdBy: string;
  },
) {
  const normalizedTitle = input.title.trim()
    ? input.title.trim()
    : await resolveUntitledPostTitle(input.createdBy);
  if (requiresPublishableStatus(input.status)) {
    requirePublishablePost({
      title: normalizedTitle,
      contentJson: input.contentJson,
    });
  }
  const slug = await resolveSlug(input.slug, normalizedTitle);
  const materialized = await materializePostContent(input.contentJson);
  const mediaReferences = await resolvePostMediaReferences({
    coverImageUrl: input.coverImageUrl,
    contentJson: materialized.contentJson,
  });
  const publishedAt = isPublishedPost(input) ? new Date() : null;

  const post = await postRepo.createPost({
    title: normalizedTitle,
    slug,
    contentJson: materialized.contentJson,
    contentHtml: materialized.contentHtml,
    contentText: materialized.contentText,
    contentToc: materialized.contentToc,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    folderId: input.folderId || null,
    status: input.status,
    publishedAt,
    readingTimeMinutes: materialized.readingTimeMinutes,
    wordCount: materialized.wordCount,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    isFeatured: input.isFeatured,
    createdBy: input.createdBy,
    tagIds: input.tagIds,
    mediaReferences,
  });

  await postOperationLogRepo.createPostOperationLog({
    operation: "create",
    summary: buildPostOperationSummary({
      type: "create",
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
    createdBy: input.createdBy,
    postId: post.id,
  });

  return post;
}

export async function createEmptyPost(input: {
  createdBy: string;
  folderId?: string | null;
  status?: PostStatus;
}) {
  return createPost({
    title: "",
    contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    excerpt: null,
    coverImageUrl: null,
    categoryId: null,
    folderId: input.folderId ?? null,
    status: input.status ?? "draft",
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    isFeatured: false,
    tagIds: [],
    createdBy: input.createdBy,
  });
}

export async function updatePost(
  id: string,
  input: PostWriteInput & {
    updatedBy: string;
  },
) {
  const existingPost = await postRepo.findPostById(id);
  if (!existingPost) {
    throw new NotFoundError("文章不存在");
  }

  const slug =
    existingPost.slug || (await resolveSlug(input.slug, input.title));
  if (requiresPublishableStatus(input.status)) {
    requirePublishablePost({
      title: input.title,
      contentJson: input.contentJson,
    });
  }
  const materialized = await materializePostContent(input.contentJson);
  const mediaReferences = await resolvePostMediaReferences({
    coverImageUrl: input.coverImageUrl,
    contentJson: materialized.contentJson,
  });

  let publishedAt = null;
  if (isPublishedPost(input)) {
    publishedAt = existingPost.publishedAt || null;
  }
  if (isPublishedPost(input) && !publishedAt) {
    publishedAt = new Date();
  }

  const post = await postRepo.updatePost(id, {
    title: input.title,
    slug,
    contentJson: materialized.contentJson,
    contentHtml: materialized.contentHtml,
    contentText: materialized.contentText,
    contentToc: materialized.contentToc,
    excerpt: input.excerpt,
    coverImageUrl: input.coverImageUrl,
    categoryId: input.categoryId || null,
    folderId: input.folderId || null,
    status: input.status,
    publishedAt,
    readingTimeMinutes: materialized.readingTimeMinutes,
    wordCount: materialized.wordCount,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    isFeatured: input.isFeatured,
    tagIds: input.tagIds,
    mediaReferences,
  });

  await postOperationLogRepo.createPostOperationLog({
    operation: "update",
    summary: buildPostOperationSummary({
      type: "update",
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

  return {
    previousPost: existingPost,
    post,
  };
}

export async function deletePost(input: {
  id: string;
  deletedBy: string;
}) {
  const existingPost = await postRepo.findPostById(input.id);
  if (!existingPost) {
    throw new NotFoundError("文章不存在");
  }

  if (isArchivedPost(existingPost)) {
    throw new NotFoundError("文章已归档");
  }

  const post = await postRepo.updatePostArchiveStatus(input.id, true);

  await postOperationLogRepo.createPostOperationLog({
    operation: "archive",
    summary: buildPostOperationSummary({
      type: "archive",
      title: existingPost.title,
    }),
    detail: {
      postIds: [input.id],
      count: 1,
      status: "archived",
      categoryId: existingPost.categoryId,
      folderId: existingPost.folder?.id ?? null,
      tagIds: existingPost.tags.map((item) => item.tag.id),
    },
    createdBy: input.deletedBy,
    postId: input.id,
  });

  return {
    previousStatus: existingPost.status,
    post,
  };
}

function getNextPublishedAt(input: {
  previousStatus?: string | null;
  nextStatus: PostStatus;
  currentPublishedAt?: Date | string | null;
}) {
  if (!isPublishedPost({ status: input.nextStatus })) {
    return null;
  }

  if (isPublishedPost({ status: input.previousStatus })) {
    return input.currentPublishedAt ? new Date(input.currentPublishedAt) : new Date();
  }

  return new Date();
}

async function requireExistingTags(tagIds: string[]) {
  if (tagIds.length === 0) {
    return;
  }

  const tags = await Promise.all(tagIds.map((tagId) => tagRepo.findTagById(tagId)));
  if (tags.some((tag) => !tag)) {
    throw new NotFoundError("部分标签不存在");
  }
}

export async function applyBulkAction(input: PostBulkActionInput & {
  updatedBy: string;
}) {
  const posts = await postRepo.findPostsByIds(input.postIds);

  if (posts.length !== input.postIds.length) {
    throw new NotFoundError("部分文章不存在或已被删除");
  }

  if (input.type === "setStatus") {
    for (const post of posts) {
      if (requiresPublishableStatus(input.status)) {
        requirePublishablePost({
          title: post.title,
          contentText: post.contentText,
        });
      }
    }

    const publishedAtById = Object.fromEntries(
      posts.map((post) => [
        post.id,
        getNextPublishedAt({
          previousStatus: post.status,
          nextStatus: input.status,
          currentPublishedAt: post.publishedAt,
        }),
      ]),
    );
    const updatedPosts = await postRepo.updatePostsStatus(
      input.postIds,
      input.status,
      publishedAtById,
    );

    await postOperationLogRepo.createPostOperationLog({
      operation: getPostBulkOperationType(input),
      summary: buildPostOperationSummary({
        type: getPostBulkOperationType(input),
        count: updatedPosts.length,
      }),
      detail: {
        postIds: updatedPosts.map((post) => post.id),
        count: updatedPosts.length,
        status: input.status,
      },
      createdBy: input.updatedBy,
    });

    return {
      previousPosts: posts,
      updatedPosts,
    };
  }

  if (input.type === "setCategory") {
    if (input.categoryId) {
      const category = await categoryRepo.findCategoryById(input.categoryId);
      if (!category) {
        throw new NotFoundError("分类不存在");
      }
    }

    const updatedPosts = await postRepo.updatePostsCategory(
      input.postIds,
      input.categoryId,
    );

    await postOperationLogRepo.createPostOperationLog({
      operation: getPostBulkOperationType(input),
      summary: buildPostOperationSummary({
        type: getPostBulkOperationType(input),
        count: updatedPosts.length,
      }),
      detail: {
        postIds: updatedPosts.map((post) => post.id),
        count: updatedPosts.length,
        categoryId: input.categoryId,
      },
      createdBy: input.updatedBy,
    });

    return {
      previousPosts: posts,
      updatedPosts,
    };
  }

  if (
    input.type === "replaceTags" ||
    input.type === "appendTags" ||
    input.type === "removeTags"
  ) {
    await requireExistingTags(input.tagIds);

    const updatedPosts =
      input.type === "replaceTags"
        ? await postRepo.replacePostsTags(input.postIds, input.tagIds)
        : input.type === "appendTags"
          ? await postRepo.appendPostsTags(input.postIds, input.tagIds)
          : await postRepo.removePostsTags(input.postIds, input.tagIds);

    await postOperationLogRepo.createPostOperationLog({
      operation: getPostBulkOperationType(input),
      summary: buildPostOperationSummary({
        type: getPostBulkOperationType(input),
        count: updatedPosts.length,
      }),
      detail: {
        postIds: updatedPosts.map((post) => post.id),
        count: updatedPosts.length,
        tagIds: input.tagIds,
      },
      createdBy: input.updatedBy,
    });

    return {
      previousPosts: posts,
      updatedPosts,
    };
  }

  if (input.folderId) {
    const folder = await folderRepo.findFolderById(input.folderId);
    if (!folder) {
      throw new NotFoundError("文件夹不存在");
    }
  }

  const updatedPosts = await postRepo.updatePostsFolder(
    input.postIds,
    input.folderId,
  );

  await postOperationLogRepo.createPostOperationLog({
    operation: getPostBulkOperationType(input),
    summary: buildPostOperationSummary({
      type: getPostBulkOperationType(input),
      count: updatedPosts.length,
    }),
    detail: {
      postIds: updatedPosts.map((post) => post.id),
      count: updatedPosts.length,
      folderId: input.folderId,
    },
    createdBy: input.updatedBy,
  });

  return {
    previousPosts: posts,
    updatedPosts,
  };
}
