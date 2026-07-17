import "server-only";

import {
  materializePostContent,
  type MaterializedPostContent,
} from "@/features/editor/content-materializer";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";

export type PostPreviewRecord = {
  id: string;
  title: string;
  status: string;
  coverImageUrl: string | null;
  contentJson: unknown;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
      color: string | null;
    };
  }>;
};

export type PostPreviewPayload = {
  id: string;
  title: string;
  status: string;
  coverImageUrl: string | null;
  authorName: string;
  displayDate: string | null;
  category: PostPreviewRecord["category"];
  tags: Array<PostPreviewRecord["tags"][number]["tag"]>;
  contentHtml: string;
  contentToc: MaterializedPostContent["contentToc"];
  readingTimeMinutes: number;
  wordCount: number;
};

type MaterializePostContent = typeof materializePostContent;

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function buildPostPreviewPayload(
  input: {
    post: PostPreviewRecord;
    authorName: string;
  },
  materialize: MaterializePostContent = materializePostContent,
): Promise<PostPreviewPayload> {
  const materialized = await materialize(input.post.contentJson);
  const displayDate =
    input.post.status === "published"
      ? input.post.publishedAt ?? input.post.updatedAt
      : input.post.updatedAt;

  return {
    id: input.post.id,
    title: getPostDisplayTitle(input.post.title),
    status: input.post.status,
    coverImageUrl: input.post.coverImageUrl,
    authorName: input.authorName.trim() || "Admin",
    displayDate: toIsoDate(displayDate),
    category: input.post.category ?? null,
    tags: input.post.tags.map((item) => item.tag),
    contentHtml: materialized.contentHtml,
    contentToc: materialized.contentToc,
    readingTimeMinutes: materialized.readingTimeMinutes,
    wordCount: materialized.wordCount,
  };
}
