import type { WorkspacePostSummary } from "@/features/content-space/lib/content-space-workspace";

export type AdminCategory = {
  id: string;
  name: string;
  _count?: {
    posts: number;
  };
};

export type AdminTag = {
  id: string;
  name: string;
  color: string | null;
};

export type ContentSpaceSelectedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: unknown;
  contentText: string;
  status: string;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string;
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  tags: { tag: AdminTag }[];
  coverImageUrl: string | null;
  subtopic: {
    id: string;
    name: string;
    slug: string;
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
};

export type ContentSpaceSubtopicGroup = {
  topicId: string;
  topicName: string;
  subtopics: Array<{
    id: string;
    name: string;
  }>;
};

export type ContentSpaceContextPost = WorkspacePostSummary;
