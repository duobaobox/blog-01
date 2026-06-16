import { hasMeaningfulContent, normalizeContentJson } from "@/features/editor/content-types";
import { UNTITLED_POST_TITLE } from "@/features/posts/lib/post-title";
import {
  isDraftPost,
  isPublishedPost,
  isReviewPost,
} from "@/features/posts/lib/post-status";
import { ValidationError } from "@/shared/lib/app-error";

export type PostPublishabilityInput = {
  title?: string | null;
  contentJson?: unknown;
  contentText?: string | null;
};

export type PostPublishability = {
  canPublish: boolean;
  reasons: string[];
};

function normalizeTitle(title?: string | null) {
  return title?.trim() ?? "";
}

function hasMeaningfulTitle(title?: string | null) {
  const normalized = normalizeTitle(title);
  return Boolean(normalized) && normalized !== UNTITLED_POST_TITLE;
}

function hasMeaningfulBody(input: Pick<PostPublishabilityInput, "contentJson" | "contentText">) {
  if (typeof input.contentText === "string") {
    return Boolean(input.contentText.trim());
  }

  return hasMeaningfulContent(normalizeContentJson(input.contentJson));
}

export function getPostPublishability(
  input: PostPublishabilityInput,
): PostPublishability {
  const reasons: string[] = [];

  if (!hasMeaningfulTitle(input.title)) {
    reasons.push("请先填写一个明确的文章标题");
  }

  if (!hasMeaningfulBody(input)) {
    reasons.push("请先补充正文内容后再发布");
  }

  return {
    canPublish: reasons.length === 0,
    reasons,
  };
}

export function requirePublishablePost(input: PostPublishabilityInput) {
  const publishability = getPostPublishability(input);

  if (!publishability.canPublish) {
    throw new ValidationError(publishability.reasons[0] ?? "文章暂时无法发布");
  }
}

export function isReadyToPublishPost(
  input: PostPublishabilityInput & { status?: string | null },
) {
  if (isPublishedPost(input)) {
    return false;
  }

  if (isReviewPost(input)) {
    return true;
  }

  return (
    (isDraftPost(input) || !input.status) &&
    getPostPublishability(input).canPublish
  );
}

export function countReadyToPublishPosts(
  posts: Array<PostPublishabilityInput & { status?: string | null }>,
) {
  return posts.reduce(
    (count, post) => count + (isReadyToPublishPost(post) ? 1 : 0),
    0,
  );
}
