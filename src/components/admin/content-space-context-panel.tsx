"use client";

import {
  ArrowUpRight,
  Clock3,
  FileSearch,
  FolderKanban,
  Layers3,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { buildContentContextSummary } from "@/features/content-space/lib/content-space-context";
import { buildContentSpaceListSections } from "@/features/content-space/lib/content-space-list-sections";
import { buildContentSpaceViewModel } from "@/features/content-space/lib/content-space-view-model";
import { buildContentSpaceWorkflowModel } from "@/features/content-space/lib/content-space-workflow";
import type { ContentSpaceEntry } from "@/features/content-space/lib/content-space-workspace";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import type { ContentSpaceContextPost } from "./content-space-types";

type ContentSpaceContextPanelProps = {
  entry: ContentSpaceEntry;
  searchQuery: string;
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
    count: number;
  },
) {
  if (entry === "drafts") {
    return {
      icon: NotebookPen,
      title: "草稿箱",
      description: `这里放的是还在打磨中的内容，共 ${options.count} 篇。`,
    };
  }

  if (entry === "ready") {
    return {
      icon: Sparkles,
      title: "待发布",
      description: `适合最后检查后再公开，共 ${options.count} 篇。`,
    };
  }

  if (entry === "topic") {
    return {
      icon: FolderKanban,
      title: options.topicName ?? "专题",
      description: "从专题视角看内容组织和写作进度。",
    };
  }

  if (entry === "subtopic") {
    return {
      icon: Layers3,
      title: options.subtopicName ?? "子专题",
      description: "这里聚焦同一分支下的文章，适合连续补写与整理。",
    };
  }

  if (entry === "search") {
    return {
      icon: FileSearch,
      title: `搜索 “${options.searchQuery}”`,
      description: `找到 ${options.count} 条相关内容。`,
    };
  }

  return {
    icon: Clock3,
    title: "最近编辑",
    description: "从最近动过的内容继续写，减少找回上下文的成本。",
  };
}

export function ContentSpaceContextPanel({
  entry,
  searchQuery,
  topic,
  subtopic,
  posts,
  selectedPostId,
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
    count: posts.length,
  });
  const sections = buildContentSpaceListSections({
    entry,
    posts,
  });
  const workflow = buildContentSpaceWorkflowModel({
    entry,
    posts,
  });
  const Icon = meta.icon;

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="border-b px-5 py-4">
        <div className="mb-2 flex items-start gap-3">
          <div className="rounded-md border bg-muted/40 p-2 text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">
              {meta.title}
            </div>
            <div className="text-xs leading-5 text-muted-foreground">
              {meta.description}
            </div>
            <div className="mt-1 text-[11px] font-medium text-foreground/75">
              {viewModel.emphasis}
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

        {topic || subtopic ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {topic ? <span>{topic.name}</span> : null}
            {subtopic ? <span>/ {subtopic.name}</span> : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">
              {summary.contextLabel}
            </div>
            <div className="mt-1 text-base font-semibold text-foreground">
              {summary.totalCount}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">草稿</div>
            <div className="mt-1 text-base font-semibold text-foreground">
              {summary.draftCount}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">已发布</div>
            <div className="mt-1 text-base font-semibold text-foreground">
              {summary.publishedCount}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">{summary.hint}</div>

        {workflow.cards.length > 0 && viewModel.workflowLabel ? (
          <div className="mt-4 space-y-2">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground">
              {viewModel.workflowLabel}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {workflow.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg border bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-foreground">
                      {card.title}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {card.count}
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {card.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {posts.length === 0 ? (
          <PostsEmptyState
            title={viewModel.emptyTitle}
            description="先创建一篇文章，之后它会自动出现在对应专题里。"
            className="px-4 pt-8"
            size="sm"
            icon={null}
          >
            <Button size="sm" onClick={() => void onCreateNew()}>
              创建文章
            </Button>
          </PostsEmptyState>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <div className="px-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground">
                  {section.title}
                </div>
                {section.posts.map((post) => {
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
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeDate(post.updatedAt)}
                        </span>
                      </div>
                      {post.subtopic ? (
                        <div className="text-xs text-muted-foreground">
                          {post.subtopic.topic.name} / {post.subtopic.name}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
