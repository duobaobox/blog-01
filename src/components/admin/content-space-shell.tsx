"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutPanelLeft, Menu } from "lucide-react";
import { createEmptyPost } from "@/features/posts/actions/post.actions";
import type { ContentTreeFolder } from "@/features/content-space/lib/content-space-tree";
import {
  buildContentSpaceUrl,
  type ContentSpaceEntry,
  type ContentSpaceParams,
} from "@/features/content-space/lib/content-space-workspace";
import {
  loadWorkspaceSession,
  saveWorkspaceSession,
  type WorkspaceSession,
} from "@/features/content-space/lib/workspace-session";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { useConfirm } from "@/shared/lib/use-confirm";
import { ContentEditorShell } from "./content-editor-shell";
import { ContentSpaceContextPanel } from "./content-space-context-panel";
import { ContentSpaceSidebar } from "./content-space-sidebar";
import type {
  AdminCategory,
  AdminTag,
  ContentSpaceContextPost,
  ContentSpaceFolderOption,
  ContentSpaceSelectedPost,
} from "./content-space-types";

type ContentSpaceShellProps = {
  params: ContentSpaceParams;
  tree: ContentTreeFolder[];
  quickEntryCounts: {
    all: number;
    drafts: number;
    ready: number;
  };
  activeEntry: ContentSpaceEntry;
  activeFolder?: {
    id: string;
    name: string;
    slug: string;
  };
  selectedPost?: ContentSpaceSelectedPost;
  selectedPostId?: string;
  contextPosts: ContentSpaceContextPost[];
  categories: AdminCategory[];
  tags: AdminTag[];
  folderOptions: ContentSpaceFolderOption[];
  searchQuery: string;
  mode: "new" | "edit";
};

export function ContentSpaceShell({
  params,
  tree,
  quickEntryCounts,
  activeEntry,
  activeFolder,
  selectedPost,
  selectedPostId,
  contextPosts,
  categories,
  tags,
  folderOptions,
  searchQuery,
  mode,
}: ContentSpaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [localTree, setLocalTree] = useState(tree);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasExplicitLocationParam = Boolean(
    params.postId || params.folder || params.entry || params.q,
  );
  const beforeLeaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);

  const leaveConfirm = useConfirm();

  useEffect(() => {
    setLocalTree(tree);
  }, [tree]);

  const effectiveTree = localTree;
  const hasFolders = effectiveTree.length > 0;
  const effectiveFolderOptions = useMemo(
    () =>
      effectiveTree.map((folder) => ({
        id: folder.id,
        name: folder.name,
      })),
    [effectiveTree],
  );

  useEffect(() => {
    if (hasExplicitLocationParam || mode === "new") return;

    /* When URL has no explicit params and the server already resolved
       activeEntry to "all", the user deliberately chose this view.
       Do not override with saved session — that would cause an infinite reload. */
    if (activeEntry === "all") return;

    const savedSession = loadWorkspaceSession();
    if (!savedSession) return;

    const next: Partial<{
      entry: ContentSpaceEntry;
      folderId?: string;
      postId?: string;
      view: "new" | "edit";
      q?: string;
    }> = { view: "edit" };

    if (
      savedSession.activeEntry === "drafts" ||
      savedSession.activeEntry === "ready"
    ) {
      next.entry = savedSession.activeEntry;
      next.folderId = undefined;
    } else if (
      (savedSession.activeEntry === "folder" ||
        savedSession.activeEntry === "post") &&
      savedSession.folderId
    ) {
      next.entry = "folder";
      next.folderId = savedSession.folderId;
    } else {
      next.entry = "all";
    }

    if (savedSession.postId) {
      next.postId = savedSession.postId;
    }

    const nextUrl = buildContentSpaceUrl(pathname, {
      current: {
        entry: activeEntry,
        folderId: activeFolder?.id,
        postId: selectedPostId,
        view: mode,
        q: searchQuery,
      },
      next,
    });

    if (nextUrl === pathname || nextUrl === `${pathname}?`) return;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }, [
    activeEntry,
    activeFolder?.id,
    hasExplicitLocationParam,
    mode,
    pathname,
    router,
    searchQuery,
    selectedPostId,
  ]);

  useEffect(() => {
    const session: WorkspaceSession = {
      activeEntry:
        selectedPostId && activeFolder?.id
          ? "post"
          : activeEntry === "search"
            ? "all"
            : activeEntry,
      folderId: activeFolder?.id,
      postId: selectedPostId,
    };

    saveWorkspaceSession(session);
  }, [activeEntry, activeFolder?.id, selectedPostId]);

  async function confirmNavigation() {
    if (beforeLeaveHandlerRef.current) {
      return beforeLeaveHandlerRef.current();
    }

    if (!hasUnsavedChanges) return true;

    return leaveConfirm.confirm();
  }

  function navigate(
    next: Partial<{
      entry: ContentSpaceEntry;
      folderId?: string;
      postId?: string;
      view: "new" | "edit";
      q?: string;
    }>,
  ) {
    const url = buildContentSpaceUrl(pathname, {
      current: {
        entry: activeEntry,
        folderId: activeFolder?.id,
        postId: selectedPostId,
        view: mode,
        q: searchQuery,
      },
      next,
    });

    startTransition(() => {
      router.push(url);
    });
  }

  async function handleCreateNew() {
    if (!(await confirmNavigation())) return;
    if (!hasFolders) {
      window.alert("请先创建文件夹，再新建文章。");
      return;
    }
    setSidebarOpen(false);
    const nextEntry = activeFolder ? "folder" : activeEntry;

    try {
      const post = await createEmptyPost({
        folderId: activeFolder?.id ?? null,
        status: "draft",
      });

      navigate({
        entry: nextEntry,
        folderId: activeFolder?.id,
        postId: post.id,
        view: "edit",
        q: "",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "创建文章失败";
      window.alert(message);
    }
  }

  async function handleSelectEntry(
    entry: Extract<ContentSpaceEntry, "all" | "drafts" | "ready">,
  ) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry,
      folderId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    });
  }

  async function handleSelectFolder(folderId: string) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry: "folder",
      folderId,
      postId: undefined,
      view: "edit",
      q: "",
    });
  }

  async function handleSelectPost(
    postId: string,
    options?: { folderId?: string },
  ) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry: options?.folderId || activeFolder ? "folder" : activeEntry,
      folderId: options?.folderId ?? activeFolder?.id,
      postId,
      view: "edit",
    });
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

  const sidebar = (
    <ContentSpaceSidebar
      tree={effectiveTree}
      activeEntry={activeEntry}
      activeFolderId={selectedPost?.folder?.id ?? activeFolder?.id}
      onSelectFolder={handleSelectFolder}
      onSelectEntry={handleSelectEntry}
      onFolderCreated={(folder) => {
        setLocalTree((current) => {
          if (current.some((item) => item.id === folder.id)) {
            return current;
          }

          return [
            ...current,
            {
              id: folder.id,
              name: folder.name,
              slug: folder.slug,
              posts: [],
            },
          ];
        });
      }}
      onFolderDeleted={(folderId) => {
        setLocalTree((current) =>
          current.filter((folder) => folder.id !== folderId),
        );
      }}
    />
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <div className="hidden w-[168px] shrink-0 border-r lg:block">
        {sidebar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
            内容空间
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleCreateNew()}
          >
            <LayoutPanelLeft className="size-4" />
            新建
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[210px_minmax(0,1fr)]">
          <div className="min-h-0 border-r bg-background">
            <ContentSpaceContextPanel
              entry={activeEntry}
              searchQuery={searchQuery}
              folder={activeFolder}
              quickEntries={[
                { key: "all", label: "全部", count: quickEntryCounts.all },
                {
                  key: "drafts",
                  label: "草稿",
                  count: quickEntryCounts.drafts,
                },
                {
                  key: "ready",
                  label: "待发布",
                  count: quickEntryCounts.ready,
                },
              ]}
              posts={contextPosts}
              selectedPostId={selectedPostId}
              onSelectEntry={handleSelectEntry}
              onSelectPost={handleSelectPost}
              onCreateNew={handleCreateNew}
              canCreatePost={hasFolders}
            />
          </div>

          <div className="min-h-0">
            <ContentEditorShell
              selectedPost={selectedPost}
              mode={mode}
              activeFolderId={activeFolder?.id}
              hasFolders={hasFolders}
              categories={categories}
              tags={tags}
              folderOptions={effectiveFolderOptions}
              onDirtyChange={setHasUnsavedChanges}
              registerBeforeLeave={(handler) => {
                beforeLeaveHandlerRef.current = handler;
              }}
              onCreateNew={handleCreateNew}
            />
          </div>
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[224px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>内容空间导航</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={leaveConfirm.open}
        onOpenChange={(open) => !open && leaveConfirm.handleCancel()}
        title="离开当前内容"
        description="当前有未保存内容，确认切换到其他专题或文章吗？"
        confirmText="离开"
        variant="destructive"
        onConfirm={leaveConfirm.handleConfirm}
      />
    </div>
  );
}
