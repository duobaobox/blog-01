"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { FilePlus2, Globe, Menu, NotebookPen, Search } from "lucide-react";
import { PostForm } from "@/components/admin/post-form";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

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
  onCreateNew: () => void;
  onSelectPost: (postId: string) => void;
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
        <span className={cn(
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
            {post.title || "未命名文章"}
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
      <div className="flex gap-1 px-3 py-2.5">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + new post */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索文章"
            className="h-8 rounded-md bg-muted/60 pl-8 text-xs shadow-none"
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
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">没有找到文章</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateNew}
              className="h-7 text-xs"
            >
              <FilePlus2 className="size-3" />
              新建文章
            </Button>
          </div>
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
}: PostsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const selectedPost =
    mode === "new"
      ? undefined
      : (posts.find((post) => post.id === selectedPostId) ?? posts[0]);

  function confirmNavigation() {
    if (!hasUnsavedChanges) return true;

    return window.confirm("当前有未保存内容，确认离开并切换文章吗？");
  }

  function goTo(url: string) {
    startTransition(() => {
      router.push(url);
    });
  }

  function handleCreateNew() {
    if (!confirmNavigation()) return;

    setNavigatorOpen(false);
    goTo(`${pathname}?view=new`);
  }

  function handleSelectPost(postId: string) {
    if (mode !== "new" && selectedPost?.id === postId) {
      setNavigatorOpen(false);
      return;
    }

    if (!confirmNavigation()) return;

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
        <PostForm
          post={selectedPost}
          categories={categories}
          tags={tags}
          onDirtyChange={setHasUnsavedChanges}
        />
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
    </div>
  );
}
