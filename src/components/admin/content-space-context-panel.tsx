"use client";

import {
  ArrowUpRight,
  Clock3,
  FileSearch,
  FolderKanban,
  Layers3,
  Search,
  ArrowUpDown,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { buildContentContextSummary } from "@/features/content-space/lib/content-space-context";
import { buildContentSpaceViewModel } from "@/features/content-space/lib/content-space-view-model";
import type { ContentSpaceEntry } from "@/features/content-space/lib/content-space-workspace";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { ContentSpaceContextPost } from "./content-space-types";

type ContentSpaceContextPanelProps = {
  entry: ContentSpaceEntry;
  searchQuery: string;
  search: string;
  topic?: {
    id: string;
    name: string;
    slug: string;
  };
  subtopic?: {
    id: string;
    name: string;
    slug: string;
  };
  posts: ContentSpaceContextPost[];
  selectedPostId?: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
};

function formatRelativeDate(value: Date | string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / minute))} 分钟前`;
  }

  if (diff < day) {
    return `${Math.max(1, Math.round(diff / hour))} 小时前`;
  }

  if (diff < day * 7) {
    return `${Math.max(1, Math.round(diff / day))} 天前`;
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getContextMeta(
  entry: ContentSpaceEntry,
  options: {
    topicName?: string;
    subtopicName?: string;
    searchQuery: string;
  },
) {
  if (entry === "drafts") {
    return {
      icon: NotebookPen,
      title: "草稿",
    };
  }

  if (entry === "ready") {
    return {
      icon: Sparkles,
      title: "待发布",
    };
  }

  if (entry === "topic") {
    return {
      icon: FolderKanban,
      title: options.topicName ?? "专题",
    };
  }

  if (entry === "subtopic") {
    return {
      icon: Layers3,
      title: options.subtopicName ?? "子专题",
    };
  }

  if (entry === "search") {
    return {
      icon: FileSearch,
      title: `搜索 “${options.searchQuery}”`,
    };
  }

  return {
    icon: Clock3,
    title: "最近编辑",
  };
}

export function ContentSpaceContextPanel({
  entry,
  searchQuery,
  search,
  topic,
  subtopic,
  posts,
  selectedPostId,
  onSearchChange,
  onSearchSubmit,
  onSelectPost,
  onCreateNew,
}: ContentSpaceContextPanelProps) {
  const summary = buildContentContextSummary({
    entry,
    topicName: topic?.name,
    subtopicName: subtopic?.name,
    searchQuery,
    posts,
  });
  const viewModel = buildContentSpaceViewModel({
    entry,
    posts,
  });
  const meta = getContextMeta(entry, {
    topicName: topic?.name,
    subtopicName: subtopic?.name,
    searchQuery,
  });
  const Icon = meta.icon;

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="border-b px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md border bg-muted/40 p-2 text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="text-sm font-semibold text-foreground">
                {meta.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.totalCount} 篇文章
              </div>
            </div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {summary.hint}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => void onCreateNew()}
          >
            <ArrowUpRight className="size-3.5" />
            新建
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onSearchSubmit();
              }
            }}
            placeholder="搜索文章"
            aria-label="搜索文章"
            className="h-9"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => void onSearchSubmit()}
          >
            <Search className="size-4" />
            搜索
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled
          >
            <ArrowUpDown className="size-4" />
            排序
          </Button>
        </div>

        {entry !== "search" ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>{summary.contextLabel}</span>
            {topic ? <span>/ {topic.name}</span> : null}
            {subtopic ? <span>/ {subtopic.name}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {posts.length === 0 ? (
          <PostsEmptyState
            title={viewModel.emptyTitle}
            description={
              entry === "search"
                ? "换个关键词或切换上下文试试。"
                : "先创建一篇文章，之后它会自动出现在对应专题里。"
            }
            className="px-4 pt-8"
            size="sm"
            icon={null}
          >
            {entry === "search" ? null : (
              <Button size="sm" onClick={() => void onCreateNew()}>
                创建文章
              </Button>
            )}
          </PostsEmptyState>
        ) : (
          <div className="space-y-1.5">
            {posts.map((post) => {
              const isActive = post.id === selectedPostId;

              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => void onSelectPost(post.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "border-accent bg-accent/60"
                      : "border-transparent hover:border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        post.status === "published"
                          ? "bg-emerald-500"
                          : "bg-amber-500",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {getPostDisplayTitle(post.title)}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeDate(post.updatedAt)}
                    </span>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{post.status === "published" ? "已发布" : "草稿"}</span>
                    {post.subtopic ? (
                      <span>
                        {post.subtopic.topic.name} / {post.subtopic.name}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
