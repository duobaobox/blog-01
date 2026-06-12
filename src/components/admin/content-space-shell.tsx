"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutPanelLeft, Menu } from "lucide-react";
import type { ContentTreeTopic } from "@/features/content-space/lib/content-space-tree";
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
  ContentSpaceSelectedPost,
  ContentSpaceSubtopicGroup,
} from "./content-space-types";

type ContentSpaceShellProps = {
  params: ContentSpaceParams;
  tree: ContentTreeTopic[];
  quickEntryCounts: {
    recent: number;
    drafts: number;
    ready: number;
  };
  activeEntry: ContentSpaceEntry;
  activeTopic?: {
    id: string;
    name: string;
    slug: string;
  };
  activeSubtopic?: {
    id: string;
    name: string;
    slug: string;
  };
  selectedPost?: ContentSpaceSelectedPost;
  selectedPostId?: string;
  contextPosts: ContentSpaceContextPost[];
  categories: AdminCategory[];
  tags: AdminTag[];
  subtopicGroups: ContentSpaceSubtopicGroup[];
  searchQuery: string;
  mode: "new" | "edit";
};

export function ContentSpaceShell({
  params,
  tree,
  quickEntryCounts,
  activeEntry,
  activeTopic,
  activeSubtopic,
  selectedPost,
  selectedPostId,
  contextPosts,
  categories,
  tags,
  subtopicGroups,
  searchQuery,
  mode,
}: ContentSpaceShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState(searchQuery);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasExplicitLocationParam = Boolean(
    params.postId || params.topic || params.subtopic || params.entry || params.q,
  );
  const beforeLeaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  const leaveConfirm = useConfirm();

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (hasExplicitLocationParam || mode === "new") return;

    const savedSession = loadWorkspaceSession();
    if (!savedSession) return;

    const next: Partial<{
      entry: ContentSpaceEntry;
      topicId?: string;
      subtopicId?: string;
      postId?: string;
      view: "new" | "edit";
      q?: string;
    }> = { view: "edit" };

    if (savedSession.activeEntry === "drafts" || savedSession.activeEntry === "ready") {
      next.entry = savedSession.activeEntry;
      next.topicId = undefined;
      next.subtopicId = undefined;
    } else if (savedSession.activeEntry === "topic" && savedSession.topicId) {
      next.entry = "topic";
      next.topicId = savedSession.topicId;
      next.subtopicId = undefined;
    } else if (
      (savedSession.activeEntry === "subtopic" || savedSession.activeEntry === "post") &&
      savedSession.subtopicId
    ) {
      next.entry = "subtopic";
      next.topicId = savedSession.topicId;
      next.subtopicId = savedSession.subtopicId;
    } else {
      next.entry = "recent";
    }

    if (savedSession.postId) {
      next.postId = savedSession.postId;
    }

    const nextUrl = buildContentSpaceUrl(pathname, {
      current: {
        entry: activeEntry,
        topicId: activeTopic?.id,
        subtopicId: activeSubtopic?.id,
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
    activeSubtopic?.id,
    activeTopic?.id,
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
        selectedPostId && activeSubtopic?.id
          ? "post"
          : activeEntry === "search"
            ? "recent"
            : activeEntry,
      topicId: activeTopic?.id,
      subtopicId: activeSubtopic?.id,
      postId: selectedPostId,
    };

    saveWorkspaceSession(session);
  }, [activeEntry, activeSubtopic?.id, activeTopic?.id, selectedPostId]);

  async function confirmNavigation() {
    if (beforeLeaveHandlerRef.current) {
      return beforeLeaveHandlerRef.current();
    }

    if (!hasUnsavedChanges) return true;

    return leaveConfirm.confirm();
  }

  function navigate(next: Partial<{
    entry: ContentSpaceEntry;
    topicId?: string;
    subtopicId?: string;
    postId?: string;
    view: "new" | "edit";
    q?: string;
  }>) {
    const url = buildContentSpaceUrl(pathname, {
      current: {
        entry: activeEntry,
        topicId: activeTopic?.id,
        subtopicId: activeSubtopic?.id,
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
    setSidebarOpen(false);

    navigate({
      entry:
        activeSubtopic || activeTopic
          ? activeSubtopic
            ? "subtopic"
            : "topic"
          : activeEntry,
      topicId: activeTopic?.id,
      subtopicId: activeSubtopic?.id,
      postId: undefined,
      view: "new",
    });
  }

  async function handleSelectEntry(entry: Extract<ContentSpaceEntry, "recent" | "drafts" | "ready">) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry,
      topicId: undefined,
      subtopicId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    });
  }

  async function handleSelectTopic(topicId: string) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry: "topic",
      topicId,
      subtopicId: undefined,
      postId: undefined,
      view: "edit",
      q: "",
    });
  }

  async function handleSelectSubtopic(topicId: string, subtopicId: string) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry: "subtopic",
      topicId,
      subtopicId,
      postId: undefined,
      view: "edit",
      q: "",
    });
  }

  async function handleSelectPost(
    postId: string,
    options?: { topicId?: string; subtopicId?: string },
  ) {
    if (!(await confirmNavigation())) return;
    setSidebarOpen(false);
    navigate({
      entry:
        options?.subtopicId || activeSubtopic
          ? "subtopic"
          : options?.topicId || activeTopic
            ? "topic"
            : activeEntry,
      topicId: options?.topicId ?? activeTopic?.id,
      subtopicId: options?.subtopicId ?? activeSubtopic?.id,
      postId,
      view: "edit",
    });
  }

  async function handleReturnToStructure() {
    if (!(await confirmNavigation())) return;

    navigate({
      entry: activeSubtopic ? "subtopic" : activeTopic ? "topic" : activeEntry,
      topicId: activeTopic?.id,
      subtopicId: activeSubtopic?.id,
      postId: undefined,
      view: "edit",
    });
  }

  async function handleSearchSubmit() {
    const normalizedSearch = search.trim();
    if (normalizedSearch === searchQuery.trim()) return;
    if (!(await confirmNavigation())) return;

    setSidebarOpen(false);
    navigate({
      postId: undefined,
      view: "edit",
      q: normalizedSearch,
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
      search={search}
      onSearchChange={setSearch}
      onSearchSubmit={handleSearchSubmit}
      onCreateNew={handleCreateNew}
      quickEntries={[
        { key: "recent", label: "最近编辑", count: quickEntryCounts.recent },
        { key: "drafts", label: "草稿", count: quickEntryCounts.drafts },
        { key: "ready", label: "待发布", count: quickEntryCounts.ready },
      ]}
      tree={tree}
      activeEntry={activeEntry}
      activeTopicId={activeTopic?.id}
      activeSubtopicId={activeSubtopic?.id}
      activePostId={selectedPostId}
      onSelectEntry={handleSelectEntry}
      onSelectTopic={handleSelectTopic}
      onSelectSubtopic={handleSelectSubtopic}
      onSelectPost={handleSelectPost}
    />
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <div className="hidden w-[300px] shrink-0 border-r lg:block">{sidebar}</div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-4" />
            内容空间
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void handleCreateNew()}>
            <LayoutPanelLeft className="size-4" />
            新建
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="min-h-0 border-r bg-background">
            <ContentSpaceContextPanel
              entry={activeEntry}
              searchQuery={searchQuery}
              topic={activeTopic}
              subtopic={activeSubtopic}
              posts={contextPosts}
              selectedPostId={selectedPostId}
              onSelectPost={handleSelectPost}
              onCreateNew={handleCreateNew}
            />
          </div>

          <div className="min-h-0">
            <ContentEditorShell
              selectedPost={selectedPost}
              mode={mode}
              categories={categories}
              tags={tags}
              subtopicGroups={subtopicGroups}
              onDirtyChange={setHasUnsavedChanges}
              registerBeforeLeave={(handler) => {
                beforeLeaveHandlerRef.current = handler;
              }}
              contextTopic={activeTopic}
              contextSubtopic={activeSubtopic}
              contextPosts={contextPosts}
              onCreateNew={handleCreateNew}
              onSelectPost={handleSelectPost}
              onReturnToStructure={handleReturnToStructure}
            />
          </div>
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[320px] p-0">
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
