"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Ellipsis,
  FolderKanban,
  Plus,
} from "lucide-react";
import type { ContentTreeFolder } from "@/features/content-space/lib/content-space-tree";
import { buildContentSpaceFolderView } from "@/features/content-space/lib/content-space-folder-view";
import type { ContentSpaceEntry } from "@/features/content-space/lib/content-space-workspace";
import { deleteFolder } from "@/features/content-space/actions/folder.actions";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { FolderCreateDialog } from "./folder-create-dialog";
import { OverflowTooltipLabel } from "./overflow-tooltip-label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type ContentSpaceSidebarProps = {
  tree: ContentTreeFolder[];
  activeEntry: ContentSpaceEntry;
  activeFolderId?: string;
  onSelectFolder: (folderId: string) => void | Promise<void>;
  onSelectEntry?: (
    entry: Extract<ContentSpaceEntry, "all" | "drafts" | "ready">,
  ) => void | Promise<void>;
  onFolderCreated?: (folder: {
    id: string;
    name: string;
    slug: string;
  }) => void | Promise<void>;
  onFolderDeleted?: (folderId: string) => void | Promise<void>;
};

export function ContentSpaceSidebar({
  tree,
  activeEntry,
  activeFolderId,
  onSelectFolder,
  onSelectEntry,
  onFolderCreated,
  onFolderDeleted,
}: ContentSpaceSidebarProps) {
  const router = useRouter();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const folderView = useMemo(() => buildContentSpaceFolderView(tree), [tree]);


  async function handleDeleteFolder(folderId: string) {
    await deleteFolder(folderId);
    await onFolderDeleted?.(folderId);

    if (activeFolderId !== folderId) {
      router.refresh();
      return;
    }

    const currentIndex = folderView.findIndex((folder) => folder.id === folderId);
    const fallbackFolder =
      folderView[currentIndex + 1] ??
      folderView[currentIndex - 1];

    if (fallbackFolder) {
      await onSelectFolder(fallbackFolder.id);
    } else if (onSelectEntry) {
      await onSelectEntry("all");
    }

    router.refresh();
  }

  return (
    <>
      <TooltipProvider delay={1000}>
        <div className="flex h-full flex-col bg-muted/10">
          <div className="flex-1 overflow-y-auto px-1 py-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <div className="text-[11px] font-medium tracking-wide text-muted-foreground">
                文件夹
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="添加文件夹"
                onClick={() => setFolderDialogOpen(true)}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {folderView.map((folder) => {
                const isFolderActive = activeFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg border border-transparent transition-colors",
                      isFolderActive
                        ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-within:border-sidebar-ring/60 focus-within:bg-sidebar-accent focus-within:text-sidebar-accent-foreground",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void onSelectFolder(folder.id)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
                        isFolderActive
                          ? "text-sidebar-accent-foreground"
                          : "text-foreground/85 hover:text-foreground",
                      )}
                    >
                      <FolderKanban
                        className={cn(
                          "size-4 shrink-0",
                          isFolderActive
                            ? "text-sidebar-accent-foreground"
                            : "text-muted-foreground",
                        )}
                      />
                      <OverflowTooltipLabel
                        label={folder.name}
                        className="flex-1 font-medium"
                      />
                      <span
                        className={cn(
                          "shrink-0 text-[11px]",
                          isFolderActive
                            ? "text-sidebar-accent-foreground/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {folder.postCount}
                      </span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        id={`folder-actions-${folder.id}`}
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="mr-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-sidebar-accent-foreground"
                          />
                        }
                      >
                        <Ellipsis className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-28">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingFolder({
                              id: folder.id,
                              name: folder.name,
                            });
                            setFolderDialogOpen(true);
                          }}
                        >
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => void handleDeleteFolder(folder.id)}
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>

      <FolderCreateDialog
        open={folderDialogOpen}
        onOpenChange={(open) => {
          setFolderDialogOpen(open);
          if (!open) {
            setEditingFolder(null);
          }
        }}
        onCreated={(folder) => {
          void onFolderCreated?.(folder);
          void onSelectFolder(folder.id);
        }}
        folder={editingFolder ?? undefined}
      />
    </>
  );
}
