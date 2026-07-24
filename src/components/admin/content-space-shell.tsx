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
import { deleteFolder } from "@/features/content-space/actions/folder.actions";
import {
  createEmptyPost,
  deletePost,
  restorePost,
} from "@/features/posts/actions/post.actions";
import type { ContentTreeFolder } from "@/features/content-space/lib/content-space-tree";
import type {
  FolderPostStatusCounts,
  FolderPostStatusFilter,
} from "@/features/content-space/queries/content-space.query";
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
  ContentSpaceSelectedPost,
} from "./content-space-types";

type ContentSpaceShellProps = {
  tree: ContentTreeFolder[];
  activeFolder?: {
    id: string;
    name: string;
    slug: string;
  };
  selectedPost?: ContentSpaceSelectedPost;
  selectedPostId?: string;
  contextPosts: ContentSpaceContextPost[];
  folderStatusCounts: FolderPostStatusCounts;
  statusFilter: FolderPostStatusFilter;
  categories: AdminCategory[];
  tags: AdminTag[];
  searchQuery: string;
  mode: "new" | "edit";
};

type WorkspaceLocation = {
  folderId?: string;
  postId?: string;
  status?: FolderPostStatusFilter;
  q?: string;
};

export function ContentSpaceShell({
  tree,
  activeFolder,
  selectedPost,
  selectedPostId,
  contextPosts,
  folderStatusCounts,
  statusFilter,
  categories,
  tags,
  searchQuery,
  mode,
}: ContentSpaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [createdFolders, setCreatedFolders] = useState<ContentTreeFolder[]>([]);
  const [deletedFolderIds, setDeletedFolderIds] = useState<string[]>([]);
  const beforeLeaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  const leaveConfirm = useConfirm();

  const effectiveTree = useMemo(() => {
    const deleted = new Set(deletedFolderIds);
    const current = tree.filter((folder) => !deleted.has(folder.id));
    const currentIds = new Set(current.map((folder) => folder.id));

    for (const folder of createdFolders) {
      if (!deleted.has(folder.id) && !currentIds.has(folder.id)) {
        current.push(folder);
      }
    }

    return current;
  }, [createdFolders, deletedFolderIds, tree]);
  const hasFolders = effectiveTree.length > 0;
  const folderOptions = useMemo(
    () => effectiveTree.map((folder) => ({ id: folder.id, name: folder.name })),
    [effectiveTree],
  );

  function buildUrl(next: WorkspaceLocation) {
    const query = new URLSearchParams();
    const folderId = next.folderId;
    const status = next.status ?? "all";
    const normalizedQuery = next.q?.trim() ?? "";

    if (folderId) query.set("folder", folderId);
    if (status !== "all") query.set("status", status);
    if (normalizedQuery) query.set("q", normalizedQuery);
    if (next.postId) query.set("postId", next.postId);

    const queryString = query.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  async function confirmNavigation() {
    if (beforeLeaveHandlerRef.current) {
      return beforeLeaveHandlerRef.current();
    }
    if (!hasUnsavedChanges) return true;
    return leaveConfirm.confirm();
  }

  function navigate(next: WorkspaceLocation, replace = false) {
    const url = buildUrl(next);
    startTransition(() => {
      if (replace) router.replace(url);
      else router.push(url);
    });
  }

  async function navigateWithGuard(
    next: WorkspaceLocation,
    options?: { closeSidebar?: boolean; replace?: boolean },
  ) {
    if (!(await confirmNavigation())) return false;
    if (options?.closeSidebar) setSidebarOpen(false);
    navigate(next, options?.replace);
    return true;
  }

  async function handleCreateNew() {
    if (!activeFolder) {
      window.alert("请先创建并选择一个文件夹，再新建文章。");
      return;
    }
    if (!(await confirmNavigation())) return;

    try {
      const post = await createEmptyPost({
        folderId: activeFolder.id,
        status: "draft",
      });
      setSidebarOpen(false);
      navigate({
        folderId: activeFolder.id,
        status: statusFilter,
        q: searchQuery,
        postId: post.id,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "创建文章失败");
    }
  }

  async function handleSelectFolder(folderId: string) {
    await navigateWithGuard(
      { folderId, status: "all" },
      { closeSidebar: true },
    );
  }

  async function handleSelectStatus(nextStatus: FolderPostStatusFilter) {
    if (!activeFolder) return;
    await navigateWithGuard({
      folderId: activeFolder.id,
      status: nextStatus,
      q: searchQuery,
    });
  }

  async function handleSearch(query: string) {
    if (!activeFolder) return;
    await navigateWithGuard({
      folderId: activeFolder.id,
      status: statusFilter,
      q: query,
    });
  }

  async function handleSelectPost(postId: string) {
    if (!activeFolder) return;
    await navigateWithGuard(
      {
        folderId: activeFolder.id,
        status: statusFilter,
        q: searchQuery,
        postId,
      },
      { closeSidebar: true },
    );
  }

  async function handleDeletePost(postId: string) {
    if (!activeFolder) return;
    const deletingSelectedPost = postId === selectedPostId;
    await deletePost(postId);

    if (!deletingSelectedPost) {
      startTransition(() => router.refresh());
      return;
    }

    const fallbackPost = contextPosts.find((post) => post.id !== postId);
    navigate({
      folderId: activeFolder.id,
      status: statusFilter,
      q: searchQuery,
      postId: fallbackPost?.id,
    });
  }

  async function handleRestorePost(postId: string) {
    if (!activeFolder) return;
    if (postId === selectedPostId && !(await confirmNavigation())) return;

    await restorePost(postId);

    if (postId !== selectedPostId) {
      startTransition(() => router.refresh());
      return;
    }

    const fallbackPost = contextPosts.find((post) => post.id !== postId);
    navigate({
      folderId: activeFolder.id,
      status: "archived",
      q: searchQuery,
      postId: fallbackPost?.id,
    });
  }

  async function handleDeleteFolder(folderId: string) {
    try {
      await deleteFolder(folderId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除文件夹失败");
      return;
    }

    setDeletedFolderIds((current) =>
      current.includes(folderId) ? current : [...current, folderId],
    );
    setCreatedFolders((current) =>
      current.filter((folder) => folder.id !== folderId),
    );

    if (activeFolder?.id !== folderId) {
      startTransition(() => router.refresh());
      return;
    }

    const remainingFolders = effectiveTree.filter(
      (folder) => folder.id !== folderId,
    );
    navigate({ folderId: remainingFolders[0]?.id, status: "all" });
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
      activeFolderId={selectedPost?.folder?.id ?? activeFolder?.id}
      onSelectFolder={handleSelectFolder}
      onFolderCreated={(folder) => {
        setCreatedFolders((current) => [
          ...current.filter((item) => item.id !== folder.id),
          {
            id: folder.id,
            name: folder.name,
            slug: folder.slug,
            postCount: 0,
            posts: [],
          },
        ]);
        setDeletedFolderIds((current) =>
          current.filter((folderId) => folderId !== folder.id),
        );
      }}
      onDeleteFolder={handleDeleteFolder}
    />
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <div className="hidden w-[168px] shrink-0 border-r lg:block">{sidebar}</div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-4" />
            文件夹
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleCreateNew()}
            disabled={!activeFolder}
          >
            <LayoutPanelLeft className="size-4" />
            新建
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="min-h-0 border-r bg-background">
            <ContentSpaceContextPanel
              key={`${activeFolder?.id ?? "empty"}:${statusFilter}:${searchQuery}`}
              folder={activeFolder}
              statusFilter={statusFilter}
              statusCounts={folderStatusCounts}
              searchQuery={searchQuery}
              posts={contextPosts}
              selectedPostId={selectedPostId}
              onSelectStatus={handleSelectStatus}
              onSelectPost={handleSelectPost}
              onCreateNew={handleCreateNew}
              onSearch={handleSearch}
              onDeletePost={handleDeletePost}
              onRestorePost={handleRestorePost}
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
              folderOptions={folderOptions}
              onDirtyChange={setHasUnsavedChanges}
              registerBeforeLeave={(handler) => {
                beforeLeaveHandlerRef.current = handler;
              }}
              onDeletePost={handleDeletePost}
              onCreateNew={handleCreateNew}
            />
          </div>
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[224px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>文件夹导航</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={leaveConfirm.open}
        onOpenChange={(open) => !open && leaveConfirm.handleCancel()}
        title="离开当前内容"
        description="当前有未保存内容，确认切换到其他文件夹或文章吗？"
        confirmText="离开"
        variant="destructive"
        onConfirm={leaveConfirm.handleConfirm}
      />
    </div>
  );
}
