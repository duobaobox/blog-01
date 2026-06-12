"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  FolderPlus,
} from "lucide-react";
import type { ContentTreeTopic } from "@/features/content-space/lib/content-space-tree";
import {
  getSubtopicRowActionModel,
  getTopicRowActionModel,
} from "@/features/content-space/lib/content-space-node-actions";
import { deriveSidebarExpansionState } from "@/features/content-space/lib/content-space-sidebar-state";
import type { ContentSpaceEntry } from "@/features/content-space/lib/content-space-workspace";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type QuickEntry = {
  key: Extract<ContentSpaceEntry, "recent" | "drafts" | "ready">;
  label: string;
  count?: number;
};

type ContentSpaceSidebarProps = {
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

export function ContentSpaceSidebar({
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
}: ContentSpaceSidebarProps) {
  const [expandedTopicIds, setExpandedTopicIds] = useState<string[]>([]);
  const [expandedSubtopicIds, setExpandedSubtopicIds] = useState<string[]>([]);
  const forceExpandAllForSearch = activeEntry === "search";

  const treeView = useMemo(() => tree, [tree]);
  const effectiveExpandedTopicIds = useMemo(
    () =>
      activeTopicId && !expandedTopicIds.includes(activeTopicId)
        ? [...expandedTopicIds, activeTopicId]
        : expandedTopicIds,
    [activeTopicId, expandedTopicIds],
  );
  const effectiveExpandedSubtopicIds = useMemo(
    () =>
      activeSubtopicId && !expandedSubtopicIds.includes(activeSubtopicId)
        ? [...expandedSubtopicIds, activeSubtopicId]
        : expandedSubtopicIds,
    [activeSubtopicId, expandedSubtopicIds],
  );

  return (
    <div className="flex h-full flex-col bg-muted/10">
      <div className="border-b px-3 py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-foreground">内容空间</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onCreateNew()}
            disabled
            aria-disabled="true"
            title="文件夹创建能力即将提供"
            className="gap-1.5 px-2 text-xs text-muted-foreground"
          >
            <FolderPlus className="size-3.5" />
            添加文件夹
          </Button>
        </div>
        <Tabs
          value={
            quickEntries.some((entry) => entry.key === activeEntry)
              ? activeEntry
              : quickEntries[0]?.key
          }
          onValueChange={(value) => void onSelectEntry(value as QuickEntry["key"])}
          suppressHydrationWarning
        >
          <TabsList className="grid w-full grid-cols-3" suppressHydrationWarning>
            {quickEntries.map((entry) => (
              <TabsTrigger
                key={entry.key}
                value={entry.key}
                suppressHydrationWarning
                className="gap-1 text-xs"
              >
                <span>{entry.label}</span>
                {typeof entry.count === "number" ? (
                  <span className="text-[11px] text-muted-foreground">
                    {entry.count}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
              expandedTopicIds: effectiveExpandedTopicIds,
              expandedSubtopicIds: effectiveExpandedSubtopicIds,
              forceExpandAllForSearch,
            });
            const topicActionModel = getTopicRowActionModel({
              expanded: topicExpansion.topicExpanded,
              active: isTopicActive,
              subtopicCount: topic.subtopics.length,
            });

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
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {topic.name}
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
                      expandedTopicIds: effectiveExpandedTopicIds,
                      expandedSubtopicIds: effectiveExpandedSubtopicIds,
                      forceExpandAllForSearch,
                    });
                    const subtopicActionModel = getSubtopicRowActionModel({
                      expanded: subtopicExpansion.subtopicExpanded,
                      active: isSubtopicActive,
                      postCount: subtopic.posts.length,
                      hiddenPostCount: 0,
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
                            <span className="min-w-0 flex-1 truncate">
                              {subtopic.name}
                            </span>
                          </button>
                        </div>
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
