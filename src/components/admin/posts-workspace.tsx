"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { FilePlus2, Globe, Menu, NotebookPen, Search } from "lucide-react";
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
  contentJson?: unknown | null;
  contentMarkdown: string;
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
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
};

type PostsWorkspaceProps = {
  posts: WorkspacePost[];
  categories: Category[];
  tags: Tag[];
  mode: "new" | "edit";
  selectedPostId?: string;
  showEmptyState?: boolean;
};

function formatRelativeDate(value: Date | string | null) {
  if (!value) return "刚刚";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute));
    return `${minutes} 分钟前`;
  }

  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour));
    return `${hours} 小时前`;
  }

  if (diff < day * 7) {
    const days = Math.max(1, Math.round(diff / day));
    return `${days} 天前`;
  }

  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

type NavigatorPanelProps = {
  posts: WorkspacePost[];
  selectedPostId?: string;
  mode: "new" | "edit";
  search: string;
  onSearchChange: (value: string) => void;
  onCreateNew: () => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
};

type StatusTab = "all" | "published" | "draft";

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
  onSearchChange,
  onCreateNew,
  onSelectPost,
}: NavigatorPanelProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const deferredSearch = useDeferredValue(search);
  const query = deferredSearch.trim().toLowerCase();

  const filteredPosts = posts
    .filter((post) => {
      if (activeTab === "published") return post.status === "published";
      if (activeTab === "draft") return post.status !== "published";
      return true;
    })
    .filter((post) => {
      if (!query) return true;
      const haystack = [
        post.title,
        post.excerpt ?? "",
        post.category?.name ?? "",
        ...post.tags.map((item) => item.tag.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  const hasPosts = posts.length > 0;
  const isSearchOrFilterActive = activeTab !== "all" || query.length > 0;

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

  return (
    <div className="flex h-full flex-col">
      {/* Status tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as StatusTab)}
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

      {/* Search + new post */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索文章"
            className="h-8 rounded-md bg-muted/60 pl-8 text-xs shadow-none"
            suppressHydrationWarning
          />
        </div>
        <Button
          size="icon-sm"
          variant={mode === "new" ? "secondary" : "ghost"}
          onClick={onCreateNew}
        >
          <FilePlus2 className="size-4" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredPosts.length === 0 ? (
          <PostsEmptyState
            title={
              hasPosts
                ? "没有匹配结果"
                : mode === "new"
                  ? "正在创建第一篇文章"
                  : "还没有文章"
            }
            description={
              hasPosts
                ? isSearchOrFilterActive
                  ? "换个关键词或筛选条件试试。"
                  : "当前列表为空。"
                : mode === "new"
                  ? "保存后会显示在这里。"
                  : "点击右上角加号开始创建。"
            }
            className="px-4 pt-8"
            size="sm"
            icon={null}
          />
        ) : (
          <div className="flex flex-col pt-1">
            {filteredPosts.map((post) => renderPostItem(post))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PostsWorkspace({
  posts,
  categories,
  tags,
  mode,
  selectedPostId,
  showEmptyState = false,
}: PostsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const beforeLeaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  const leaveConfirm = useConfirm();
  const hasPosts = posts.length > 0;
  const selectedPost =
    mode === "new"
      ? undefined
      : (posts.find((post) => post.id === selectedPostId) ?? posts[0]);

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

  async function handleCreateNew() {
    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(`${pathname}?view=new`);
  }

  async function handleSelectPost(postId: string) {
    if (mode !== "new" && selectedPost?.id === postId) {
      setNavigatorOpen(false);
      return;
    }

    if (!(await confirmNavigation())) return;

    setNavigatorOpen(false);
    goTo(`${pathname}?postId=${postId}`);
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
      onSearchChange={setSearch}
      onCreateNew={handleCreateNew}
      onSelectPost={handleSelectPost}
    />
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left nav (desktop) */}
      <div className="hidden w-64 shrink-0 border-r lg:block">
        {navigatorPanel}
      </div>

      {/* Right side: mobile nav bar + editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile nav toggle */}
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

        {/* Editor area */}
        {showEmptyState && !hasPosts ? (
          <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
            <PostsEmptyState
              title="还没有文章"
              description="先创建第一篇文章，之后它会出现在左侧列表。"
              className="max-w-sm"
              size="lg"
              icon={FilePlus2}
            >
              <Button onClick={handleCreateNew}>
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

      {/* Mobile nav sheet */}
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
