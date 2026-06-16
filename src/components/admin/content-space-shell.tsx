"use client";

import {
  type FormEvent,
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutPanelLeft, Menu } from "lucide-react";
import { deleteFolder } from "@/features/content-space/actions/folder.actions";
import {
  deleteContentSpaceSavedView,
  saveContentSpaceSavedView,
} from "@/features/content-space/actions/content-space-saved-view.actions";
import { buildContentSpaceFolderView } from "@/features/content-space/lib/content-space-folder-view";
import {
  applyBulkPostAction,
  createEmptyPost,
  deletePost,
} from "@/features/posts/actions/post.actions";
import type { ContentTreeFolder } from "@/features/content-space/lib/content-space-tree";
import {
  buildContentSpaceUrl,
  type ContentLibraryFilters,
  type ContentSpaceEntry,
  type ContentSpaceParams,
} from "@/features/content-space/lib/content-space-workspace";
import {
  normalizeSavedContentViewName,
  type SavedContentView,
} from "@/features/content-space/lib/content-space-saved-view";
import {
  buildWorkspaceSessionRestoreParams,
  loadWorkspaceSession,
  saveWorkspaceSession,
  type WorkspaceSession,
} from "@/features/content-space/lib/workspace-session";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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
  params: ContentSpaceParams;
  tree: ContentTreeFolder[];
  quickEntryCounts: {
    library: number;
    recent: number;
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
  libraryFilters: ContentLibraryFilters;
  libraryPage: number;
  libraryTotalPages: number;
  libraryTotalPosts: number;
  recentPage: number;
  recentTotalPages: number;
  recentTotalPosts: number;
  categories: AdminCategory[];
  tags: AdminTag[];
  savedViews: SavedContentView[];
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
  libraryFilters,
  libraryPage,
  libraryTotalPages,
  libraryTotalPosts,
  recentPage,
  recentTotalPages,
  recentTotalPosts,
  categories,
  tags,
  savedViews: initialSavedViews,
  searchQuery,
  mode,
}: ContentSpaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [createdFolders, setCreatedFolders] = useState<ContentTreeFolder[]>([]);
  const [deletedFolderIds, setDeletedFolderIds] = useState<string[]>([]);
  const [selectedBulkPostIds, setSelectedBulkPostIds] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedContentView[]>(initialSavedViews);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [savedViewNameInput, setSavedViewNameInput] = useState("");
  const [savingView, setSavingView] = useState(false);
  const hasExplicitLocationParam = Boolean(
    params.postId || params.folder || params.entry || params.page || params.q,
  );
  const beforeLeaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);

  const leaveConfirm = useConfirm();
  const effectiveTree = useMemo(() => {
    const deletedFolderSet = new Set(deletedFolderIds);
    const serverFolders = tree.filter((folder) => !deletedFolderSet.has(folder.id));
    const mergedFolders = [...serverFolders];
    const existingIds = new Set(serverFolders.map((folder) => folder.id));

    for (const folder of createdFolders) {
      if (!existingIds.has(folder.id) && !deletedFolderSet.has(folder.id)) {
        mergedFolders.push(folder);
      }
    }

    return mergedFolders;
  }, [createdFolders, deletedFolderIds, tree]);
  const hasFolders = effectiveTree.length > 0;
  const effectiveFolderOptions = useMemo(
    () =>
      effectiveTree.map((folder) => ({
        id: folder.id,
        name: folder.name,
      })),
    [effectiveTree],
  );
  const folderView = useMemo(
    () => buildContentSpaceFolderView(effectiveTree),
    [effectiveTree],
  );
  const activeFeedPage =
    activeEntry === "recent"
      ? recentPage
      : activeEntry === "library"
        ? libraryPage
        : undefined;
  const visibleBulkPostIds = useMemo(
    () => new Set(contextPosts.map((post) => post.id)),
    [contextPosts],
  );
  const effectiveSelectedBulkPostIds = useMemo(
    () => activeEntry === "library"
      ? selectedBulkPostIds.filter((postId) => visibleBulkPostIds.has(postId))
      : [],
    [activeEntry, selectedBulkPostIds, visibleBulkPostIds],
  );

  useEffect(() => {
    if (hasExplicitLocationParam || mode === "new") return;

    /* When URL has no explicit params and the server already resolved
       activeEntry to "library", the user deliberately chose this view.
       Do not override with saved session — that would cause an infinite reload. */
    if (activeEntry === "library") return;

    const savedSession = loadWorkspaceSession();
    if (!savedSession) return;

    const next = buildWorkspaceSessionRestoreParams(savedSession);

    const nextUrl = buildContentSpaceUrl(pathname, {
      current: {
        entry: activeEntry,
        folderId: activeFolder?.id,
        postId: selectedPostId,
        view: mode,
        page: activeFeedPage,
        filters: libraryFilters,
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
    activeFeedPage,
    activeFolder?.id,
    hasExplicitLocationParam,
    libraryFilters,
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
          : activeEntry,
      folderId: activeFolder?.id,
      postId: selectedPostId,
      page: activeFeedPage,
      filters: activeEntry === "library" ? libraryFilters : undefined,
      searchQuery: activeEntry === "search" ? searchQuery : undefined,
    };

    saveWorkspaceSession(session);
  }, [
    activeEntry,
    activeFeedPage,
    activeFolder?.id,
    libraryFilters,
    searchQuery,
    selectedPostId,
  ]);

  useEffect(() => {
    setSavedViews(initialSavedViews);
  }, [initialSavedViews]);

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
      page?: number;
      filters?: ContentLibraryFilters;
      q?: string;
    }>,
  ) {
    const url = buildContentSpaceUrl(pathname, {
      current: {
        entry: activeEntry,
        folderId: activeFolder?.id,
        postId: selectedPostId,
        view: mode,
        page: activeFeedPage,
        filters: libraryFilters,
        q: searchQuery,
      },
      next,
    });

    startTransition(() => {
      router.push(url);
    });
  }

  async function navigateWithGuard(
    next: Partial<{
      entry: ContentSpaceEntry;
      folderId?: string;
      postId?: string;
      view: "new" | "edit";
      page?: number;
      filters?: ContentLibraryFilters;
      q?: string;
    }>,
    options?: {
      closeSidebar?: boolean;
    },
  ) {
    if (!(await confirmNavigation())) return false;
    if (options?.closeSidebar) {
      setSidebarOpen(false);
    }
    navigate(next);
    return true;
  }

  async function confirmAndPrepareNavigation(options?: {
    closeSidebar?: boolean;
  }) {
    if (!(await confirmNavigation())) return false;
    if (options?.closeSidebar) {
      setSidebarOpen(false);
    }
    return true;
  }

  async function handleCreateNew() {
    if (!hasFolders) {
      window.alert("请先创建文件夹，再新建文章。");
      return;
    }
    if (!(await confirmAndPrepareNavigation({ closeSidebar: true }))) return;
    const nextEntry = activeFolder ? "folder" : activeEntry;

    try {
      const post = await createEmptyPost({
        folderId: activeFolder?.id ?? null,
        status: "draft",
      });

      const nextPage =
        activeFolder
          ? undefined
          : nextEntry === "recent"
            ? 1
            : nextEntry === "library"
              ? 1
              : undefined;

      navigate({
        entry: nextEntry,
        folderId: activeFolder?.id,
        postId: post.id,
        view: "edit",
        page: nextPage,
        filters: nextEntry === "library" ? libraryFilters : undefined,
        q: "",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "创建文章失败";
      window.alert(message);
    }
  }

  async function handleSelectEntry(
    entry: Extract<ContentSpaceEntry, "library" | "recent" | "drafts" | "ready">,
  ) {
    await navigateWithGuard({
      entry,
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: undefined,
      filters: entry === "library" ? libraryFilters : undefined,
      q: "",
    }, { closeSidebar: true });
  }

  async function handleSearch(query: string) {
    const normalizedQuery = query.trim();
    await navigateWithGuard({
      entry: activeFolder ? "folder" : activeEntry,
      folderId: activeFolder?.id,
      postId: undefined,
      view: "edit",
      page: undefined,
      filters:
        activeFolder || activeEntry !== "library"
          ? undefined
          : libraryFilters,
      q: normalizedQuery,
    });
  }

  async function handleSelectFeedPage(
    entry: Extract<ContentSpaceEntry, "library" | "recent">,
    page: number,
  ) {
    await navigateWithGuard({
      entry,
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page,
      filters: entry === "library" ? libraryFilters : undefined,
      q: "",
    });
  }

  async function handleUpdateLibraryFilters(filters: ContentLibraryFilters) {
    await navigateWithGuard({
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: undefined,
      filters,
      q: "",
    });
  }

  function getSuggestedSavedViewName() {
    const defaultNameParts = [
      libraryFilters.debt
        ? `治理:${libraryFilters.debt}`
        : undefined,
      libraryFilters.status
        ? `状态:${libraryFilters.status}`
        : undefined,
      libraryFilters.categoryId
        ? `分类`
        : undefined,
      libraryFilters.tagId
        ? `标签`
        : undefined,
    ].filter(Boolean);

    return defaultNameParts[0] ?? "内容视图";
  }

  function handleSaveCurrentView() {
    setSavedViewNameInput(getSuggestedSavedViewName());
    setSaveViewDialogOpen(true);
  }

  async function handleSubmitSavedView(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = normalizeSavedContentViewName(savedViewNameInput);
    if (!name) {
      return;
    }

    setSavingView(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      if (libraryFilters.status) {
        formData.set("status", libraryFilters.status);
      }
      if (libraryFilters.categoryId) {
        formData.set("categoryId", libraryFilters.categoryId);
      }
      if (libraryFilters.tagId) {
        formData.set("tagId", libraryFilters.tagId);
      }
      if (libraryFilters.debt) {
        formData.set("debt", libraryFilters.debt);
      }

      const savedView = await saveContentSpaceSavedView(formData);
      setSavedViews((current) => [
        savedView,
        ...current.filter((view) => view.id !== savedView.id),
      ]);
      setSaveViewDialogOpen(false);
      setSavedViewNameInput("");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "保存视图失败，请稍后重试。";
      window.alert(message);
    } finally {
      setSavingView(false);
    }
  }

  async function handleApplySavedView(viewId: string) {
    const view = savedViews.find((item) => item.id === viewId);
    if (!view) {
      return;
    }

    await navigateWithGuard({
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: undefined,
      filters: view.filters,
      q: "",
    });
  }

  async function handleDeleteSavedView(viewId: string) {
    try {
      await deleteContentSpaceSavedView(viewId);
      setSavedViews((current) => current.filter((view) => view.id !== viewId));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "删除视图失败，请稍后重试。";
      window.alert(message);
    }
  }

  async function handleSelectFolder(folderId: string) {
    await navigateWithGuard({
      entry: "folder",
      folderId,
      postId: undefined,
      view: "edit",
      page: undefined,
      filters: undefined,
      q: "",
    }, { closeSidebar: true });
  }

  async function handleSelectRecentPage(page: number) {
    await handleSelectFeedPage("recent", page);
  }

  async function handleSelectLibraryPage(page: number) {
    await handleSelectFeedPage("library", page);
  }

  async function handleSelectPost(
    postId: string,
    options?: { folderId?: string },
  ) {
    await navigateWithGuard({
      entry: options?.folderId || activeFolder ? "folder" : activeEntry,
      folderId: options?.folderId ?? activeFolder?.id,
      postId,
      view: "edit",
      page:
        options?.folderId || activeFolder
          ? undefined
          : activeEntry === "recent"
            ? recentPage
            : activeEntry === "library"
              ? libraryPage
              : undefined,
      filters:
        options?.folderId || activeFolder || activeEntry !== "library"
          ? undefined
          : libraryFilters,
    }, { closeSidebar: true });
  }

  async function handleDeletePost(postId: string) {
    const deletingSelectedPost = postId === selectedPostId;
    await deletePost(postId);
    setSelectedBulkPostIds((current) => current.filter((id) => id !== postId));

    if (!deletingSelectedPost) {
      startTransition(() => {
        router.refresh();
      });
      return;
    }

    const nextContextPosts = contextPosts.filter((post) => post.id !== postId);
    const fallbackPost = nextContextPosts[0];

    if (fallbackPost) {
      navigate({
        entry: fallbackPost.folder?.id ? "folder" : activeEntry,
        folderId: fallbackPost.folder?.id ?? activeFolder?.id,
        postId: fallbackPost.id,
        view: "edit",
        page:
          fallbackPost.folder?.id
            ? undefined
            : activeEntry === "recent"
              ? recentPage
              : activeEntry === "library"
                ? libraryPage
                : undefined,
        filters:
          fallbackPost.folder?.id || activeEntry !== "library"
            ? undefined
            : libraryFilters,
        q: searchQuery,
      });
      return;
    }

    navigate({
      entry: activeFolder ? "folder" : "library",
      folderId: activeFolder?.id,
      postId: undefined,
      view: "edit",
      page: activeFolder ? undefined : libraryPage,
      filters: activeFolder ? undefined : libraryFilters,
      q: searchQuery,
    });
  }

  async function handleDeleteFolder(folderId: string) {
    await deleteFolder(folderId);

    setDeletedFolderIds((current) =>
      current.includes(folderId) ? current : [...current, folderId],
    );
    setCreatedFolders((current) =>
      current.filter((folder) => folder.id !== folderId),
    );

    if (activeFolder?.id !== folderId) {
      startTransition(() => {
        router.refresh();
      });
      return;
    }

    const currentIndex = folderView.findIndex((folder) => folder.id === folderId);
    const fallbackFolder =
      folderView[currentIndex + 1] ??
      folderView[currentIndex - 1];

    if (fallbackFolder) {
      navigate({
        entry: "folder",
        folderId: fallbackFolder.id,
        postId: undefined,
        view: "edit",
        page: undefined,
        filters: undefined,
        q: "",
      });
      return;
    }

    navigate({
      entry: "library",
      folderId: undefined,
      postId: undefined,
      view: "edit",
      page: undefined,
      filters: libraryFilters,
      q: "",
    });
  }

  function handleToggleBulkPost(postId: string) {
    setSelectedBulkPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );
  }

  function handleToggleSelectAllPosts() {
    const visiblePostIds = contextPosts.map((post) => post.id);
    const allSelected =
      visiblePostIds.length > 0 &&
      visiblePostIds.every((postId) => effectiveSelectedBulkPostIds.includes(postId));

    setSelectedBulkPostIds(allSelected ? [] : visiblePostIds);
  }

  async function handleApplyBulkAction(input: {
    type: "setStatus" | "setCategory" | "setFolder";
    value: string;
  } | {
    type: "replaceTags" | "appendTags" | "removeTags";
    tagIds: string[];
  }) {
    if (effectiveSelectedBulkPostIds.length === 0) {
      window.alert("请先选择至少一篇文章。");
      return;
    }

    const formData = new FormData();
    formData.set("type", input.type);
    for (const postId of effectiveSelectedBulkPostIds) {
      formData.append("postIds", postId);
    }

    if (
      input.type === "replaceTags" ||
      input.type === "appendTags" ||
      input.type === "removeTags"
    ) {
      for (const tagId of input.tagIds) {
        formData.append("tagIds", tagId);
      }
    } else if (input.type === "setStatus") {
      formData.set("status", input.value);
    } else if (input.type === "setCategory") {
      formData.set("categoryId", input.value);
    } else if (input.type === "setFolder") {
      formData.set("folderId", input.value);
    }

    try {
      await applyBulkPostAction(formData);
      setSelectedBulkPostIds([]);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "批量操作失败，请稍后重试。";
      window.alert(message);
    }
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
        setCreatedFolders((current) => {
          if (current.some((item) => item.id === folder.id)) {
            return current;
          }

          return [
            ...current,
            {
              id: folder.id,
              name: folder.name,
              slug: folder.slug,
              postCount: 0,
              posts: [],
            },
          ];
        });
        setDeletedFolderIds((current) =>
          current.filter((folderId) => folderId !== folder.id),
        );
      }}
      onDeleteFolder={handleDeleteFolder}
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
              key={`${activeEntry}:${activeFolder?.id ?? "library"}:${searchQuery}`}
              entry={activeEntry}
              searchQuery={searchQuery}
              folder={activeFolder}
              categories={categories}
              tags={tags}
              folderOptions={effectiveFolderOptions}
              quickEntries={[
                { key: "library", label: "全部", count: quickEntryCounts.library },
                { key: "recent", label: "最近", count: quickEntryCounts.recent },
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
              isSearching={activeEntry === "search"}
              libraryFilters={libraryFilters}
              libraryPage={libraryPage}
              libraryTotalPages={libraryTotalPages}
              libraryTotalPosts={libraryTotalPosts}
              recentPage={recentPage}
              recentTotalPages={recentTotalPages}
              recentTotalPosts={recentTotalPosts}
              selectedBulkPostIds={effectiveSelectedBulkPostIds}
              savedViews={savedViews}
              onSelectEntry={handleSelectEntry}
              onUpdateLibraryFilters={handleUpdateLibraryFilters}
              onSelectLibraryPage={handleSelectLibraryPage}
              onSelectRecentPage={handleSelectRecentPage}
              onSelectPost={handleSelectPost}
              onToggleBulkPost={handleToggleBulkPost}
              onToggleSelectAllPosts={handleToggleSelectAllPosts}
              onSaveCurrentView={handleSaveCurrentView}
              onApplySavedView={handleApplySavedView}
              onDeleteSavedView={handleDeleteSavedView}
              onApplyBulkAction={handleApplyBulkAction}
              onCreateNew={handleCreateNew}
              onSearch={handleSearch}
              onDeletePost={handleDeletePost}
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
              onDeletePost={handleDeletePost}
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

      <Dialog
        open={saveViewDialogOpen}
        onOpenChange={(open) => {
          setSaveViewDialogOpen(open);
          if (!open) {
            setSavedViewNameInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>保存当前视图</DialogTitle>
            <DialogDescription>
              保存当前内容库筛选，后续可以一键回到这组治理视角。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSavedView} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="saved-view-name">视图名称</Label>
              <Input
                id="saved-view-name"
                value={savedViewNameInput}
                onChange={(event) => setSavedViewNameInput(event.target.value)}
                placeholder="例如：待补 SEO"
                required
                maxLength={32}
              />
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              如果名称相同，会用新的筛选条件覆盖旧视图，保持列表整洁。
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={
                  savingView || !normalizeSavedContentViewName(savedViewNameInput)
                }
              >
                {savingView ? "保存中..." : "保存视图"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveViewDialogOpen(false)}
                disabled={savingView}
              >
                取消
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
