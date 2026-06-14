"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FilePlus2,
  Ellipsis,
  X,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { buildContentSpaceViewModel } from "@/features/content-space/lib/content-space-view-model";
import type { ContentSpaceEntry } from "@/features/content-space/lib/content-space-workspace";
import { deletePost } from "@/features/posts/actions/post.actions";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
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

type QuickEntry = {
  key: Extract<ContentSpaceEntry, "all" | "drafts" | "ready">;
  label: string;
  count?: number;
};

type ContentSpaceContextPanelProps = {
  entry: ContentSpaceEntry;
  searchQuery: string;
  folder?: {
    id: string;
    name: string;
    slug: string;
  };
  quickEntries: QuickEntry[];
  posts: ContentSpaceContextPost[];
  selectedPostId?: string;
  onSelectEntry: (entry: QuickEntry["key"]) => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
  canCreatePost?: boolean;
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

export function ContentSpaceContextPanel({
  entry,
  searchQuery,
  folder,
  quickEntries,
  posts,
  selectedPostId,
  onSelectEntry,
  onSelectPost,
  onCreateNew,
  canCreatePost = true,
}: ContentSpaceContextPanelProps) {
  const router = useRouter();
  const deleteConfirm = useConfirm();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [entry, folder?.id, searchQuery]);

  const normalizedSearchQuery = localSearchQuery.trim().toLowerCase();
  const filteredPosts = useMemo(() => {
    if (!normalizedSearchQuery) return posts;

    return posts.filter((post) => {
      const haystacks = [
        post.title,
        post.excerpt ?? "",
        post.folder?.name ?? "",
      ];

      return haystacks.some((value) =>
        value.toLowerCase().includes(normalizedSearchQuery),
      );
    });
  }, [normalizedSearchQuery, posts]);

  const viewModel = buildContentSpaceViewModel({
    entry,
    posts: filteredPosts,
  });
  const activeQuickEntry = quickEntries.some((item) => item.key === entry)
    ? entry
    : quickEntries[0]?.key;

  async function handleDeletePost(postId: string) {
    if (!(await deleteConfirm.confirm())) return;

    try {
      await deletePost(postId);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      window.alert("删除失败，请稍后重试。");
    }
  }

  return (
    <>
      <TooltipProvider delay={1000}>
        <div className="flex h-full flex-col border-r bg-background">
          <div className="border-b px-3 py-3">
            <div className="flex items-center gap-2">
              <Input
                id="content-space-search"
                name="search"
                value={localSearchQuery}
                onChange={(event) => setLocalSearchQuery(event.target.value)}
                placeholder={folder ? `在 ${folder.name} 中搜索` : "搜索文章"}
                aria-label="搜索文章"
                className="h-8 flex-1"
              />
              {localSearchQuery ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => setLocalSearchQuery("")}
                  aria-label="清除搜索"
                  title="清除搜索"
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="shrink-0"
                onClick={() => void onCreateNew()}
                disabled={!canCreatePost}
                title={!canCreatePost ? "请先创建文件夹" : undefined}
                aria-label="添加文档"
              >
                <FilePlus2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filteredPosts.length === 0 ? (
                <PostsEmptyState
                  title={viewModel.emptyTitle}
                  description={
                    normalizedSearchQuery
                      ? folder
                        ? `当前文件夹里没有匹配“${localSearchQuery.trim()}”的文章。`
                        : `没有找到匹配“${localSearchQuery.trim()}”的文章。`
                      : "先创建一篇文章，之后它会自动出现在对应文件夹里。"
                  }
                  className="px-4 pt-8"
                  size="sm"
                  icon={null}
                >
                  {normalizedSearchQuery ? null : (
                    <Button
                      size="sm"
                      onClick={() => void onCreateNew()}
                      disabled={!canCreatePost}
                      title={!canCreatePost ? "请先创建文件夹" : undefined}
                    >
                      创建文章
                    </Button>
                  )}
                </PostsEmptyState>
              ) : (
                <div className="space-y-1">
                  {filteredPosts.map((post) => {
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
                                  post.status === "published"
                                    ? "bg-emerald-500"
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
                            <div
                              className={cn(
                                "flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs",
                                isActive
                                  ? "text-sidebar-accent-foreground/75"
                                  : "text-muted-foreground",
                              )}
                            >
                              <span>{post.status === "published" ? "已发布" : "草稿"}</span>
                              {post.folder ? (
                                <span>{post.folder.name}</span>
                              ) : null}
                            </div>
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
                                删除
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
                value={activeQuickEntry}
                onValueChange={(value) => void onSelectEntry(value as QuickEntry["key"])}
                suppressHydrationWarning
              >
                <TabsList
                  className="grid w-full rounded-xl bg-muted/70 p-1"
                  style={{ gridTemplateColumns: `repeat(${quickEntries.length}, minmax(0, 1fr))` }}
                  suppressHydrationWarning
                >
                  {quickEntries.map((item) => (
                    <TabsTrigger
                      key={item.key}
                      value={item.key}
                      suppressHydrationWarning
                      className="rounded-lg px-2 text-[12px] text-sidebar-foreground/70 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:shadow-sm"
                    >
                      <span className="truncate">{item.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </TooltipProvider>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && deleteConfirm.handleCancel()}
        title="删除文章"
        description="删除后不可恢复，确认继续吗？"
        confirmText="删除"
        variant="destructive"
        onConfirm={deleteConfirm.handleConfirm}
      />
    </>
  );
}
