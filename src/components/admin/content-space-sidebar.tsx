"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FileText,
  FolderKanban,
  NotebookPen,
  Search,
  Sparkles,
} from "lucide-react";
import type { ContentTreeTopic } from "@/features/content-space/lib/content-space-tree";
import {
  getSubtopicRowActionModel,
  getTopicRowActionModel,
} from "@/features/content-space/lib/content-space-node-actions";
import { buildContentTreeMetrics } from "@/features/content-space/lib/content-space-tree-metrics";
import {
  deriveSidebarExpansionState,
  getVisiblePostsForSidebarSubtopic,
} from "@/features/content-space/lib/content-space-sidebar-state";
import type { ContentSpaceEntry } from "@/features/content-space/lib/content-space-workspace";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type QuickEntry = {
  key: Extract<ContentSpaceEntry, "recent" | "drafts" | "ready">;
  label: string;
  count?: number;
};

type ContentSpaceSidebarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
  quickEntries: QuickEntry[];
  tree: ContentTreeTopic[];
  activeEntry: ContentSpaceEntry;
  activeTopicId?: string;
  activeSubtopicId?: string;
  activePostId?: string;
  onSelectEntry: (entry: QuickEntry["key"]) => void | Promise<void>;
  onSelectTopic: (topicId: string) => void | Promise<void>;
  onSelectSubtopic: (topicId: string, subtopicId: string) => void | Promise<void>;
  onSelectPost: (
    postId: string,
    options?: { topicId?: string; subtopicId?: string },
  ) => void | Promise<void>;
};

function getQuickEntryIcon(entry: QuickEntry["key"]) {
  if (entry === "drafts") return NotebookPen;
  if (entry === "ready") return Sparkles;
  return FileText;
}

function formatSidebarDate(value: string | null) {
  if (!value) return "无更新";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function ContentSpaceSidebar({
  search,
  onSearchChange,
  onSearchSubmit,
  onCreateNew,
  quickEntries,
  tree,
  activeEntry,
  activeTopicId,
  activeSubtopicId,
  activePostId,
  onSelectEntry,
  onSelectTopic,
  onSelectSubtopic,
  onSelectPost,
}: ContentSpaceSidebarProps) {
  const [expandedTopicIds, setExpandedTopicIds] = useState<string[]>([]);
  const [expandedSubtopicIds, setExpandedSubtopicIds] = useState<string[]>([]);
  const [showAllPostIds, setShowAllPostIds] = useState<string[]>([]);
  const forceExpandAllForSearch = activeEntry === "search";

  useEffect(() => {
    if (activeTopicId) {
      setExpandedTopicIds((current) =>
        current.includes(activeTopicId) ? current : [...current, activeTopicId],
      );
    }
  }, [activeTopicId]);

  useEffect(() => {
    if (activeSubtopicId) {
      setExpandedSubtopicIds((current) =>
        current.includes(activeSubtopicId)
          ? current
          : [...current, activeSubtopicId],
      );
    }
  }, [activeSubtopicId]);

  const treeView = useMemo(() => tree, [tree]);
  const treeMetrics = useMemo(() => buildContentTreeMetrics(treeView), [treeView]);

  return (
    <div className="flex h-full flex-col bg-muted/10">
      <div className="border-b px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-foreground">内容空间</div>
            <div className="text-xs text-muted-foreground">
              像笔记一样组织文章，再按需发布
            </div>
          </div>
          <Button size="icon-sm" onClick={() => void onCreateNew()}>
            <FilePlus2 className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onSearchSubmit();
              }
            }}
            placeholder="搜索标题、摘要或正文"
            className="h-8 rounded-md bg-background text-xs shadow-none"
            suppressHydrationWarning
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void onSearchSubmit()}
          >
            <Search className="size-4" />
          </Button>
        </div>
      </div>

      <div className="border-b px-2 py-2">
        <div className="mb-1 px-2 text-[11px] font-medium tracking-wide text-muted-foreground">
          工作台入口
        </div>
        <div className="space-y-1">
          {quickEntries.map((entry) => {
            const Icon = getQuickEntryIcon(entry.key);
            const isActive = activeEntry === entry.key;

            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => void onSelectEntry(entry.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                {typeof entry.count === "number" ? (
                  <span className="text-xs text-muted-foreground">{entry.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-2 px-2 text-[11px] font-medium tracking-wide text-muted-foreground">
          专题树
        </div>
        <div className="space-y-2">
          {treeView.map((topic) => {
            const isTopicActive =
              activeTopicId === topic.id && (activeEntry === "topic" || activeEntry === "subtopic");
            const topicExpansion = deriveSidebarExpansionState({
              topicId: topic.id,
              subtopicId: "",
              activeTopicId,
              activeSubtopicId,
              activePostId,
              expandedTopicIds,
              expandedSubtopicIds,
              forceExpandAllForSearch,
            });
            const topicActionModel = getTopicRowActionModel({
              expanded: topicExpansion.topicExpanded,
              active: isTopicActive,
              subtopicCount: topic.subtopics.length,
            });
            const topicMetrics = treeMetrics.topicById.get(topic.id);

            return (
              <div key={topic.id} className="space-y-1">
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md px-1",
                    isTopicActive ? "bg-accent/70" : "",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0"
                    onClick={() =>
                      setExpandedTopicIds((current) =>
                        current.includes(topic.id)
                          ? current.filter((id) => id !== topic.id)
                          : [...current, topic.id],
                        )
                    }
                    aria-label={topicActionModel.toggleLabel}
                    title={topicActionModel.toggleLabel}
                  >
                    {topicExpansion.topicExpanded ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => void onSelectTopic(topic.id)}
                    aria-label={`${topicActionModel.selectLabel}：${topic.name}`}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors",
                      isTopicActive
                        ? "text-accent-foreground"
                        : "text-foreground/85 hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <FolderKanban className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {topic.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        草稿 {topicMetrics?.draftPosts ?? 0} · 已发布{" "}
                        {topicMetrics?.publishedPosts ?? 0} · {formatSidebarDate(topicMetrics?.lastUpdatedAt ?? null)}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {topicActionModel.badgeText}
                    </span>
                  </button>
                </div>

                {topicExpansion.topicExpanded ? (
                  <div className="space-y-1 pl-3">
                  {topic.subtopics.map((subtopic) => {
                    const isSubtopicActive = activeSubtopicId === subtopic.id;
                    const subtopicExpansion = deriveSidebarExpansionState({
                      topicId: topic.id,
                      subtopicId: subtopic.id,
                      activeTopicId,
                      activeSubtopicId,
                      activePostId,
                      expandedTopicIds,
                      expandedSubtopicIds,
                      forceExpandAllForSearch,
                    });
                    const showAll = showAllPostIds.includes(subtopic.id);
                    const visiblePosts = getVisiblePostsForSidebarSubtopic(
                      subtopic.posts,
                      showAll,
                      5,
                    );
                    const subtopicMetrics = treeMetrics.subtopicById.get(subtopic.id);
                    const subtopicActionModel = getSubtopicRowActionModel({
                      expanded: subtopicExpansion.subtopicExpanded,
                      active: isSubtopicActive,
                      postCount: subtopic.posts.length,
                      hiddenPostCount: visiblePosts.hiddenCount,
                    });

                    return (
                      <div key={subtopic.id} className="space-y-1">
                        <div
                          className={cn(
                            "flex items-center gap-1 rounded-md px-1",
                            isSubtopicActive ? "bg-secondary/90" : "",
                          )}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0"
                            onClick={() =>
                              setExpandedSubtopicIds((current) =>
                                current.includes(subtopic.id)
                                  ? current.filter((id) => id !== subtopic.id)
                                  : [...current, subtopic.id],
                              )
                            }
                            aria-label={subtopicActionModel.toggleLabel}
                            title={subtopicActionModel.toggleLabel}
                          >
                            {subtopicExpansion.subtopicExpanded ? (
                              <ChevronDown className="size-3.5 opacity-70" />
                            ) : (
                              <ChevronRight className="size-3.5 opacity-70" />
                            )}
                          </Button>
                          <button
                            type="button"
                            onClick={() => void onSelectSubtopic(topic.id, subtopic.id)}
                            aria-label={`${subtopicActionModel.selectLabel}：${subtopic.name}`}
                            className={cn(
                              "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors",
                              isSubtopicActive
                                ? "text-secondary-foreground"
                                : "text-foreground/75 hover:bg-accent/50 hover:text-foreground",
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{subtopic.name}</span>
                              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                                草稿 {subtopicMetrics?.draftPosts ?? 0} · 已发布{" "}
                                {subtopicMetrics?.publishedPosts ?? 0} · {formatSidebarDate(subtopicMetrics?.lastUpdatedAt ?? null)}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {subtopicActionModel.badgeText}
                            </span>
                          </button>
                        </div>

                        {subtopicExpansion.subtopicExpanded ? (
                          <div className="space-y-0.5 pl-4">
                            {visiblePosts.items.map((post) => {
                              const isPostActive = activePostId === post.id;

                              return (
                                <button
                                  key={post.id}
                                  type="button"
                                  onClick={() =>
                                    void onSelectPost(post.id, {
                                      topicId: topic.id,
                                      subtopicId: subtopic.id,
                                    })
                                  }
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                    isPostActive
                                      ? "bg-accent/80 text-accent-foreground"
                                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 shrink-0 rounded-full",
                                      post.status === "published"
                                        ? "bg-emerald-500"
                                        : "bg-muted-foreground/50",
                                    )}
                                  />
                                  <span className="min-w-0 truncate">
                                    {getPostDisplayTitle(post.title)}
                                  </span>
                                </button>
                              );
                            })}

                            {visiblePosts.hiddenCount > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAllPostIds((current) =>
                                    current.includes(subtopic.id)
                                      ? current
                                      : [...current, subtopic.id],
                                  )
                                }
                                className="w-full rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
                              >
                                {subtopicActionModel.helperText}，展开查看
                              </button>
                            ) : showAll && subtopic.posts.length > 5 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAllPostIds((current) =>
                                    current.filter((id) => id !== subtopic.id),
                                  )
                                }
                                className="w-full rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
                              >
                                收起额外文章
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
