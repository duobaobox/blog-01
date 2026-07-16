"use client";

import { useEffect, useState } from "react";
import { Ellipsis, FilePlus2, Search, Trash2, X } from "lucide-react";
import type {
  FolderPostStatusCounts,
  FolderPostStatusFilter,
} from "@/features/content-space/queries/content-space.query";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
import {
  getPostStatusLabel,
  getPostStatusTone,
} from "@/features/posts/lib/post-status";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { useConfirm } from "@/shared/lib/use-confirm";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { OverflowTooltipLabel } from "./overflow-tooltip-label";
import type { ContentSpaceContextPost } from "./content-space-types";

type ContentSpaceContextPanelProps = {
  folder?: {
    id: string;
    name: string;
    slug: string;
  };
  statusFilter: FolderPostStatusFilter;
  statusCounts: FolderPostStatusCounts;
  searchQuery: string;
  posts: ContentSpaceContextPost[];
  selectedPostId?: string;
  onSelectStatus: (status: FolderPostStatusFilter) => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
  onSearch: (query: string) => void | Promise<void>;
  onDeletePost: (postId: string) => void | Promise<void>;
};

const STATUS_TABS: Array<{
  key: FolderPostStatusFilter;
  label: string;
}> = [
  { key: "all", label: "全部" },
  { key: "draft", label: "草稿" },
  { key: "review", label: "待发布" },
  { key: "published", label: "已发布" },
];

function formatRelativeDate(value: Date | string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))} 分钟前`;
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))} 小时前`;
  if (diff < day * 7) return `${Math.max(1, Math.round(diff / day))} 天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getEmptyTitle(status: FolderPostStatusFilter) {
  if (status === "draft") return "当前文件夹没有草稿";
  if (status === "review") return "当前文件夹没有待发布文章";
  if (status === "published") return "当前文件夹没有已发布文章";
  return "当前文件夹还没有文章";
}

export function ContentSpaceContextPanel({
  folder,
  statusFilter,
  searchQuery,
  posts,
  selectedPostId,
  onSelectStatus,
  onSelectPost,
  onCreateNew,
  onSearch,
  onDeletePost,
}: ContentSpaceContextPanelProps) {
  const deleteConfirm = useConfirm();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  async function handleDeletePost(postId: string) {
    if (!(await deleteConfirm.confirm())) return;

    try {
      await onDeletePost(postId);
    } catch {
      window.alert("归档失败，请稍后重试。");
    }
  }

  return (
    <>
      <TooltipProvider delay={1000}>
        <div className="flex h-full flex-col border-r bg-background">
          <div className="border-b px-3 py-3">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void onSearch(localSearchQuery);
              }}
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="content-space-search"
                  name="search"
                  value={localSearchQuery}
                  onChange={(event) => setLocalSearchQuery(event.target.value)}
                  placeholder={folder ? `在 ${folder.name} 中搜索` : "请先选择文件夹"}
                  aria-label="搜索当前文件夹文章"
                  className="h-8 pl-8 pr-8"
                  disabled={!folder}
                />
                {searchQuery || localSearchQuery ? (
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => {
                      setLocalSearchQuery("");
                      void onSearch("");
                    }}
                    aria-label="清除搜索"
                    title="清除搜索"
                  >
                    <X className="size-3.5" />
                  </Button>
                ) : null}
              </div>

              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="shrink-0"
                onClick={() => void onCreateNew()}
                disabled={!folder}
                title={!folder ? "请先创建文件夹" : "在当前文件夹新建文章"}
                aria-label="新建文章"
              >
                <FilePlus2 className="size-3.5" />
              </Button>
            </form>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {posts.length === 0 ? (
              <PostsEmptyState
                title={searchQuery ? "没有匹配的文章" : getEmptyTitle(statusFilter)}
                description={
                  searchQuery
                    ? `当前文件夹里没有匹配“${searchQuery}”的文章。`
                    : folder
                      ? "新文章会直接归属到当前文件夹。"
                      : "先从左侧创建一个文件夹，再开始写作。"
                }
                className="px-4 pt-8"
                size="sm"
                icon={null}
              >
                {!searchQuery && folder ? (
                  <Button size="sm" onClick={() => void onCreateNew()}>
                    创建文章
                  </Button>
                ) : null}
              </PostsEmptyState>
            ) : (
              <div className="space-y-1">
                {posts.map((post) => {
                  const isActive = post.id === selectedPostId;
                  const displayTitle = getPostDisplayTitle(post.title);

                  return (
                    <div
                      key={post.id}
                      className={cn(
                        "group rounded-lg border transition-colors",
                        isActive
                          ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                          : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-within:border-sidebar-ring/60 focus-within:bg-sidebar-accent focus-within:text-sidebar-accent-foreground",
                      )}
                    >
                      <div className="flex items-start gap-1 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => void onSelectPost(post.id)}
                          className="flex min-w-0 flex-1 flex-col items-start gap-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
                        >
                          <div className="flex w-full items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 shrink-0 rounded-full",
                                getPostStatusTone(post) === "published"
                                  ? "bg-emerald-500"
                                  : getPostStatusTone(post) === "review"
                                    ? "bg-sky-500"
                                    : "bg-amber-500",
                              )}
                            />
                            <OverflowTooltipLabel
                              label={displayTitle}
                              className={cn(
                                "flex-1 text-[13px] font-medium",
                                isActive
                                  ? "text-sidebar-accent-foreground"
                                  : "text-foreground",
                              )}
                            />
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatRelativeDate(post.updatedAt)}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-xs",
                              isActive
                                ? "text-sidebar-accent-foreground/75"
                                : "text-muted-foreground",
                            )}
                          >
                            {getPostStatusLabel(post)}
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            id={`post-actions-${post.id}`}
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="mt-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-sidebar-accent-foreground"
                                aria-label="文章操作"
                              />
                            }
                          >
                            <Ellipsis className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-28">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => void handleDeletePost(post.id)}
                            >
                              <Trash2 className="size-3.5" />
                              归档
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t px-3 py-3">
            <Tabs
              value={statusFilter}
              onValueChange={(value) =>
                void onSelectStatus(value as FolderPostStatusFilter)
              }
              suppressHydrationWarning
            >
              <TabsList
                className="grid w-full grid-cols-4 rounded-xl bg-muted/70 p-1"
                suppressHydrationWarning
              >
                {STATUS_TABS.map((item) => (
                  <TabsTrigger
                    key={item.key}
                    value={item.key}
                    disabled={!folder}
                    suppressHydrationWarning
                    className="min-w-0 rounded-lg px-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:shadow-sm"
                  >
                    <span className="truncate">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </TooltipProvider>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && deleteConfirm.handleCancel()}
        title="归档文章"
        description="归档后文章会从当前文件夹的默认列表和公开页面下线。"
        confirmText="归档"
        variant="destructive"
        onConfirm={deleteConfirm.handleConfirm}
      />
    </>
  );
}
