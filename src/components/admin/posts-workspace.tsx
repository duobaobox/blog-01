"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Globe,
  Menu,
  NotebookPen,
  Search,
} from "lucide-react";
import { PostForm } from "@/components/admin/post-form";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useConfirm } from "@/shared/lib/use-confirm";

type Category = {
  id: string;
  name: string;
  _count?: {
    posts: number;
  };
};

type Tag = {
  id: string;
  name: string;
  color: string | null;
};

type WorkspacePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentText: string;
  status: string;
  isFeatured: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt: Date | string | null;
  readingTimeMinutes: number | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    tag: Tag;
  }>;
  coverImageUrl: string | null;
};

type SelectedPost = {
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
  tags: { tag: Tag }[];
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

type StatusTab = "all" | "published" | "draft";

type PostsWorkspaceProps = {
  posts: WorkspacePost[];
  selectedPost?: SelectedPost;
  categories: Category[];
  tags: Tag[];
  mode: "new" | "edit";
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  initialSearch: string;
  initialStatus: StatusTab;
  showEmptyState?: boolean;
  hasActiveFilters?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

function formatRelativeDate(value: Date | string | null) {
  if (!value) return "刚刚";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 0 || diff > day * 7) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute));
    return `${minutes} 分钟前`;
  }

  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour));
    return `${hours} 小时前`;
  }

  const days = Math.max(1, Math.round(diff / day));
  return `${days} 天前`;
}

type NavigatorPanelProps = {
  posts: WorkspacePost[];
  selectedPostId?: string;
  mode: "new" | "edit";
  search: string;
  status: StatusTab;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasActiveFilters?: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void | Promise<void>;
  onStatusChange: (status: StatusTab) => void | Promise<void>;
  onPageChange: (page: number) => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
};

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "published", label: "已发布" },
  { key: "draft", label: "草稿" },
];

function NavigatorPanel({
  posts,
  selectedPostId,
  mode,
  search,
  status,
  currentPage,
  totalPages,
  totalPosts,
  hasActiveFilters = false,
  onSearchChange,
  onSearchSubmit,
  onStatusChange,
  onPageChange,
  onCreateNew,
  onSelectPost,
}: NavigatorPanelProps) {
  function renderPostItem(post: WorkspacePost) {
    const isActive = mode !== "new" && selectedPostId === post.id;

    return (
      <button
        key={post.id}
        type="button"
        onClick={() => onSelectPost(post.id)}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "shrink-0",
            post.status === "published"
              ? "text-green-500"
              : "text-muted-foreground",
          )}
        >
          {post.status === "published" ? (
            <Globe className="size-3.5" />
          ) : (
            <NotebookPen className="size-3.5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {getPostDisplayTitle(post.title)}
          </span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeDate(post.updatedAt)}
        </span>
      </button>
    );
  }

  const emptyTitle = hasActiveFilters
    ? "没有匹配结果"
    : mode === "new"
      ? "正在创建第一篇文章"
      : "还没有文章";
  const emptyDescription = hasActiveFilters
    ? "换个关键词或切换状态试试。"
    : mode === "new"
      ? "保存后会显示在这里。"
      : "点击右上角加号开始创建。";

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={status}
        onValueChange={(value) => onStatusChange(value as StatusTab)}
        className="px-3 py-2.5"
        suppressHydrationWarning
      >
        <TabsList suppressHydrationWarning>
          {STATUS_TABS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} suppressHydrationWarning>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-1.5 px-3 py-2">
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
          className="h-8 flex-1 rounded-md bg-muted/60 text-xs shadow-none"
          suppressHydrationWarning
        />
        <Button size="icon-sm" variant="ghost" onClick={() => void onSearchSubmit()}>
          <Search className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant={mode === "new" ? "secondary" : "ghost"}
          onClick={() => void onCreateNew()}
        >
          <FilePlus2 className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {posts.length === 0 ? (
          <PostsEmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="px-4 pt-8"
            size="sm"
            icon={null}
          />
        ) : (
          <div className="flex flex-col pt-1">
            {posts.map((post) => renderPostItem(post))}
          </div>
        )}
      </div>

      <div className="border-t px-3 py-3">
        <div className="mb-2 text-xs text-muted-foreground">
          共 {totalPosts} 篇，第 {currentPage} / {totalPages} 页
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex-1"
          >
            <ChevronLeft className="size-3.5" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex-1"
          >
            下一页
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PostsWorkspace({
  posts,
  selectedPost,
  categories,
  tags,
  mode,
  currentPage,
  totalPages,
  totalPosts,
  initialSearch,
  initialStatus,
  showEmptyState = false,
  hasActiveFilters = false,
  emptyStateTitle = "还没有文章",
  emptyStateDescription = "先创建第一篇文章，之后它会出现在左侧列表。",
}: PostsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const beforeLeaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  const leaveConfirm = useConfirm();

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  async function confirmNavigation() {
    if (beforeLeaveHandlerRef.current) {
      return beforeLeaveHandlerRef.current();
    }

    if (!hasUnsavedChanges) return true;

    return leaveConfirm.confirm();
  }

  function goTo(url: string) {
    startTransition(() => {
      router.push(url);
    });
  }

  function buildWorkspaceUrl(next: {
    page?: number;
    status?: StatusTab;
    search?: string;
    postId?: string;
    view?: "new" | "edit";
  }) {
    const params = new URLSearchParams();
    const nextPage = next.page ?? currentPage;
    const nextStatus = next.status ?? initialStatus;
    const nextSearch = (next.search ?? initialSearch).trim();
    const nextView = next.view ?? mode;

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    if (nextSearch) {
      params.set("q", nextSearch);
    }

    if (nextView === "new") {
      params.set("view", "new");
    } else if (next.postId) {
      params.set("postId", next.postId);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  async function handleCreateNew() {
    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(buildWorkspaceUrl({ view: "new" }));
  }

  async function handleSelectPost(postId: string) {
    if (mode !== "new" && selectedPost?.id === postId) {
      setNavigatorOpen(false);
      return;
    }

    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(buildWorkspaceUrl({ view: "edit", postId }));
  }

  async function handleStatusChange(status: StatusTab) {
    if (status === initialStatus) return;
    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(
      buildWorkspaceUrl({
        status,
        page: 1,
        postId: undefined,
      }),
    );
  }

  async function handleSearchSubmit() {
    const normalizedSearch = search.trim();
    if (normalizedSearch === initialSearch.trim()) return;
    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(
      buildWorkspaceUrl({
        search: normalizedSearch,
        page: 1,
        postId: undefined,
      }),
    );
  }

  async function handlePageChange(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(
      buildWorkspaceUrl({
        page,
        postId: undefined,
      }),
    );
  }

  const handleBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges) return;

    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const navigatorPanel = (
    <NavigatorPanel
      posts={posts}
      selectedPostId={selectedPost?.id}
      mode={mode}
      search={search}
      status={initialStatus}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPosts={totalPosts}
      hasActiveFilters={hasActiveFilters}
      onSearchChange={setSearch}
      onSearchSubmit={handleSearchSubmit}
      onStatusChange={handleStatusChange}
      onPageChange={handlePageChange}
      onCreateNew={handleCreateNew}
      onSelectPost={handleSelectPost}
    />
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="hidden w-64 shrink-0 border-r lg:block">{navigatorPanel}</div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center border-b px-3 py-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNavigatorOpen(true)}
          >
            <Menu className="size-4" />
            文章列表
          </Button>
        </div>

        {showEmptyState ? (
          <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
            <PostsEmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
              className="max-w-sm"
              size="lg"
              icon={FilePlus2}
            >
              <Button onClick={() => void handleCreateNew()}>
                <FilePlus2 data-icon="inline-start" />
                创建第一篇文章
              </Button>
            </PostsEmptyState>
          </div>
        ) : (
          <PostForm
            post={selectedPost}
            categories={categories}
            tags={tags}
            onDirtyChange={setHasUnsavedChanges}
            registerBeforeLeave={(handler) => {
              beforeLeaveHandlerRef.current = handler;
            }}
          />
        )}
      </div>

      <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>文章导航</SheetTitle>
          </SheetHeader>
          {navigatorPanel}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={leaveConfirm.open}
        onOpenChange={(open) => !open && leaveConfirm.handleCancel()}
        title="放弃未保存内容"
        description="当前有未保存内容，确认离开并切换文章吗？"
        confirmText="离开"
        variant="destructive"
        onConfirm={leaveConfirm.handleConfirm}
      />
    </div>
  );
}
