"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Ellipsis,
  X,
  Trash2,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { buildContentSpaceViewModel } from "@/features/content-space/lib/content-space-view-model";
import type {
  ContentLibraryFilters,
  ContentSpaceEntry,
} from "@/features/content-space/lib/content-space-workspace";
import { getPaginationPages } from "@/features/posts/lib/pagination";
import { POST_GOVERNANCE_DEBT_DEFINITIONS } from "@/features/posts/lib/post-governance";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { TagMultiSelect } from "@/features/taxonomy/components/tag-multi-select";
import { OverflowTooltipLabel } from "./overflow-tooltip-label";
import type { SavedContentView } from "@/features/content-space/lib/content-space-saved-view";
import type {
  AdminCategory,
  AdminTag,
  ContentSpaceContextPost,
} from "./content-space-types";

type QuickEntry = {
  key: Extract<ContentSpaceEntry, "library" | "recent" | "drafts" | "ready">;
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
  categories: AdminCategory[];
  tags: AdminTag[];
  folderOptions: Array<{
    id: string;
    name: string;
  }>;
  quickEntries: QuickEntry[];
  posts: ContentSpaceContextPost[];
  selectedPostId?: string;
  isSearching?: boolean;
  libraryFilters: ContentLibraryFilters;
  libraryPage: number;
  libraryTotalPages: number;
  libraryTotalPosts: number;
  recentPage: number;
  recentTotalPages: number;
  recentTotalPosts: number;
  selectedBulkPostIds: string[];
  savedViews: SavedContentView[];
  onSelectEntry: (entry: QuickEntry["key"]) => void | Promise<void>;
  onUpdateLibraryFilters: (filters: ContentLibraryFilters) => void | Promise<void>;
  onSelectLibraryPage: (page: number) => void | Promise<void>;
  onSelectRecentPage: (page: number) => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
  onToggleBulkPost: (postId: string) => void | Promise<void>;
  onToggleSelectAllPosts: () => void | Promise<void>;
  onSaveCurrentView: () => void | Promise<void>;
  onApplySavedView: (viewId: string) => void | Promise<void>;
  onDeleteSavedView: (viewId: string) => void | Promise<void>;
  onApplyBulkAction: (input: {
    type: "setStatus" | "setCategory" | "setFolder";
    value: string;
  } | {
    type: "replaceTags" | "appendTags" | "removeTags";
    tagIds: string[];
  }) => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
  onSearch: (query: string) => void | Promise<void>;
  onDeletePost: (postId: string) => void | Promise<void>;
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
  categories,
  tags,
  folderOptions,
  quickEntries,
  posts,
  selectedPostId,
  isSearching = false,
  libraryFilters,
  libraryPage,
  libraryTotalPages,
  libraryTotalPosts,
  recentPage,
  recentTotalPages,
  recentTotalPosts,
  selectedBulkPostIds,
  savedViews,
  onSelectEntry,
  onUpdateLibraryFilters,
  onSelectLibraryPage,
  onSelectRecentPage,
  onSelectPost,
  onToggleBulkPost,
  onToggleSelectAllPosts,
  onSaveCurrentView,
  onApplySavedView,
  onDeleteSavedView,
  onApplyBulkAction,
  onCreateNew,
  onSearch,
  onDeletePost,
  canCreatePost = true,
}: ContentSpaceContextPanelProps) {
  const deleteConfirm = useConfirm();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [bulkStatusValue, setBulkStatusValue] = useState("__none__");
  const [bulkCategoryValue, setBulkCategoryValue] = useState("__keep__");
  const [bulkFolderValue, setBulkFolderValue] = useState("__keep__");
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const normalizedSearchQuery = localSearchQuery.trim().toLowerCase();
  const viewModel = buildContentSpaceViewModel({
    entry,
    posts,
    debt: libraryFilters.debt,
  });
  const activeQuickEntry = quickEntries.some((item) => item.key === entry)
    ? entry
    : quickEntries[0]?.key;
  const libraryPaginationPages = getPaginationPages(libraryPage, libraryTotalPages);
  const recentPaginationPages = getPaginationPages(recentPage, recentTotalPages);
  const activeFeedPage = entry === "library" ? libraryPage : recentPage;
  const activeFeedTotalPages = entry === "library" ? libraryTotalPages : recentTotalPages;
  const activeFeedTotalPosts = entry === "library" ? libraryTotalPosts : recentTotalPosts;
  const activeFeedPaginationPages =
    entry === "library" ? libraryPaginationPages : recentPaginationPages;
  const handleSelectActiveFeedPage =
    entry === "library" ? onSelectLibraryPage : onSelectRecentPage;
  const bulkSelectionEnabled = entry === "library" && posts.length > 0;
  const selectedBulkCount = selectedBulkPostIds.length;
  const allPostsSelected = bulkSelectionEnabled && selectedBulkCount === posts.length;

  function submitSearch() {
    void onSearch(localSearchQuery);
  }

  async function handleDeletePost(postId: string) {
    if (!(await deleteConfirm.confirm())) return;

    try {
      await onDeletePost(postId);
    } catch {
      window.alert("删除失败，请稍后重试。");
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
                submitSearch();
              }}
            >
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
                  type="submit"
                  size="icon-sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={isSearching}
                  aria-label="执行搜索"
                  title="执行搜索"
                >
                  <Search className="size-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon-sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={isSearching}
                  aria-label="执行搜索"
                  title="执行搜索"
                >
                  <Search className="size-3.5" />
                </Button>
              )}
              {(searchQuery || localSearchQuery) ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0"
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
            </form>
          </div>

          {entry === "library" ? (
            <div className="border-b px-3 py-3">
              {bulkSelectionEnabled ? (
                <div className="mb-3 rounded-xl border bg-muted/30 p-2.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() => void onToggleSelectAllPosts()}
                    >
                      {allPostsSelected ? (
                        <CheckSquare className="size-3.5" />
                      ) : (
                        <Square className="size-3.5" />
                      )}
                      {allPostsSelected ? "取消全选" : "全选当前页"}
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      已选择 {selectedBulkCount} / {posts.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <Select
                      value={bulkStatusValue}
                      onValueChange={(value) => {
                        const nextValue = value ?? "__none__";
                        setBulkStatusValue(nextValue);
                        if (nextValue === "__none__") {
                          return;
                        }

                        void onApplyBulkAction({
                          type: "setStatus",
                          value: nextValue,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full" size="sm" disabled={selectedBulkCount === 0}>
                        <SelectValue placeholder="批量修改状态" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="__none__">批量修改状态</SelectItem>
                          <SelectItem value="draft">改为草稿</SelectItem>
                          <SelectItem value="review">改为待发布</SelectItem>
                          <SelectItem value="published">改为已发布</SelectItem>
                          <SelectItem value="archived">改为已归档</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select
                      value={bulkCategoryValue}
                      onValueChange={(value) => {
                        const nextValue = value ?? "__keep__";
                        setBulkCategoryValue(nextValue);
                        if (nextValue === "__keep__") {
                          return;
                        }

                        void onApplyBulkAction({
                          type: "setCategory",
                          value: nextValue,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full" size="sm" disabled={selectedBulkCount === 0}>
                        <SelectValue placeholder="批量修改分类" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="__keep__">批量修改分类</SelectItem>
                          <SelectItem value="__none__">移除分类</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select
                      value={bulkFolderValue}
                      onValueChange={(value) => {
                        const nextValue = value ?? "__keep__";
                        setBulkFolderValue(nextValue);
                        if (nextValue === "__keep__") {
                          return;
                        }

                        void onApplyBulkAction({
                          type: "setFolder",
                          value: nextValue,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full" size="sm" disabled={selectedBulkCount === 0}>
                        <SelectValue placeholder="批量移动文件夹" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="__keep__">批量移动文件夹</SelectItem>
                          <SelectItem value="__none__">移出文件夹</SelectItem>
                          {folderOptions.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <div className="rounded-lg border bg-background px-2 py-1.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          批量标签治理
                        </span>
                      </div>
                      <TagMultiSelect
                        tags={tags}
                        value={bulkTagIds}
                        onChange={setBulkTagIds}
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={selectedBulkCount === 0}
                          onClick={() =>
                            void onApplyBulkAction({
                              type: "replaceTags",
                              tagIds: bulkTagIds,
                            })
                          }
                        >
                          替换
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={selectedBulkCount === 0 || bulkTagIds.length === 0}
                          onClick={() =>
                            void onApplyBulkAction({
                              type: "appendTags",
                              tagIds: bulkTagIds,
                            })
                          }
                        >
                          追加
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={selectedBulkCount === 0 || bulkTagIds.length === 0}
                          onClick={() =>
                            void onApplyBulkAction({
                              type: "removeTags",
                              tagIds: bulkTagIds,
                            })
                          }
                        >
                          移除
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mb-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => void onSaveCurrentView()}
                >
                  保存当前视图
                </Button>
                {[
                  ...POST_GOVERNANCE_DEBT_DEFINITIONS,
                ].map((preset) => {
                  const active = libraryFilters.debt === preset.key;

                  return (
                    <Button
                      key={preset.key}
                      type="button"
                      size="sm"
                      variant={active ? "secondary" : "outline"}
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() =>
                        void onUpdateLibraryFilters({
                          ...libraryFilters,
                          debt: active ? undefined : (preset.key as ContentLibraryFilters["debt"]),
                        })
                      }
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>

              {savedViews.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {savedViews.map((view) => (
                    <div
                      key={view.id}
                      className="inline-flex items-center gap-1 rounded-full border bg-background pl-3 pr-1 py-1 text-xs"
                    >
                      <button
                        type="button"
                        className="max-w-[10rem] truncate text-left"
                        onClick={() => void onApplySavedView(view.id)}
                      >
                        {view.name}
                      </button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`删除视图 ${view.name}`}
                        onClick={() => void onDeleteSavedView(view.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select
                  value={libraryFilters.status ?? "__all__"}
                  onValueChange={(value) =>
                    void onUpdateLibraryFilters({
                      ...libraryFilters,
                      status:
                        typeof value === "string" && value !== "__all__"
                          ? value
                          : undefined,
                      debt: undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="__all__">全部状态</SelectItem>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="review">待发布</SelectItem>
                      <SelectItem value="published">已发布</SelectItem>
                      <SelectItem value="archived">已归档</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select
                  value={libraryFilters.categoryId ?? "__all__"}
                  onValueChange={(value) =>
                    void onUpdateLibraryFilters({
                      ...libraryFilters,
                      categoryId:
                        typeof value === "string" && value !== "__all__"
                          ? value
                          : undefined,
                      debt: undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder="全部分类">
                      {(value) => {
                        if (!value || value === "__all__") {
                          return "全部分类";
                        }

                        return categories.find((category) => category.id === value)?.name ?? "全部分类";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="__all__">全部分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select
                  value={libraryFilters.tagId ?? "__all__"}
                  onValueChange={(value) =>
                    void onUpdateLibraryFilters({
                      ...libraryFilters,
                      tagId:
                        typeof value === "string" && value !== "__all__"
                          ? value
                          : undefined,
                      debt: undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder="全部标签">
                      {(value) => {
                        if (!value || value === "__all__") {
                          return "全部标签";
                        }

                        return tags.find((tag) => tag.id === value)?.name ?? "全部标签";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="__all__">全部标签</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {posts.length === 0 ? (
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
                          {entry === "library" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="mt-0.5 shrink-0 text-muted-foreground"
                              aria-label={selectedBulkPostIds.includes(post.id) ? "取消选择文章" : "选择文章"}
                              onClick={() => void onToggleBulkPost(post.id)}
                            >
                              {selectedBulkPostIds.includes(post.id) ? (
                                <CheckSquare className="size-3.5" />
                              ) : (
                                <Square className="size-3.5" />
                              )}
                            </Button>
                          ) : null}

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
                                    : getPostStatusTone(post) === "archived"
                                      ? "bg-slate-400"
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
                            <div
                              className={cn(
                                "flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs",
                                isActive
                                  ? "text-sidebar-accent-foreground/75"
                                  : "text-muted-foreground",
                              )}
                              >
                              <span>{getPostStatusLabel(post)}</span>
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

            {(entry === "library" || entry === "recent") && activeFeedTotalPages > 1 ? (
              <div className="border-t px-3 py-3">
                <div className="mb-2 text-[11px] text-muted-foreground">
                  共 {activeFeedTotalPosts} 篇内容，第 {activeFeedPage} / {activeFeedTotalPages} 页
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    disabled={activeFeedPage <= 1}
                    onClick={() => void handleSelectActiveFeedPage(activeFeedPage - 1)}
                    aria-label="上一页"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>

                  {activeFeedPaginationPages.map((page, index) =>
                    page === "ellipsis" ? (
                      <span
                        key={`${entry}-ellipsis-${index}`}
                        className="inline-flex h-7 w-7 items-center justify-center text-xs text-muted-foreground"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        type="button"
                        variant={page === activeFeedPage ? "secondary" : "outline"}
                        size="icon-sm"
                        onClick={() => void handleSelectActiveFeedPage(page)}
                        aria-current={page === activeFeedPage ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    ),
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    disabled={activeFeedPage >= activeFeedTotalPages}
                    onClick={() => void handleSelectActiveFeedPage(activeFeedPage + 1)}
                    aria-label="下一页"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}

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
        title="归档文章"
        description="归档后会从默认内容库和公开页面下线，但后续仍可恢复。"
        confirmText="归档"
        variant="destructive"
        onConfirm={deleteConfirm.handleConfirm}
      />
    </>
  );
}
