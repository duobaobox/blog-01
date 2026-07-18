"use client";

import { useCallback, useRef, useState } from "react";
import { Eye } from "lucide-react";
import {
  PostPreviewDialog,
  type AdminPostPreview,
} from "@/components/admin/post-preview-dialog";
import { PostForm } from "@/components/admin/post-form";
import { getPostPreview } from "@/features/posts/actions/post-preview.actions";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { Button } from "@/shared/ui/button";
import type {
  AdminCategory,
  AdminTag,
  ContentSpaceSelectedPost,
} from "./content-space-types";

type BeforeLeaveHandler = (() => Promise<boolean>) | null;

type ContentEditorShellProps = {
  selectedPost?: ContentSpaceSelectedPost;
  mode: "new" | "edit";
  activeFolderId?: string;
  hasFolders: boolean;
  categories: AdminCategory[];
  tags: AdminTag[];
  folderOptions: Array<{
    id: string;
    name: string;
  }>;
  onDirtyChange: (dirty: boolean) => void;
  registerBeforeLeave: (handler: BeforeLeaveHandler) => void;
  onDeletePost: (postId: string) => void | Promise<void>;
  onCreateNew: () => void | Promise<void>;
};

export function ContentEditorShell({
  selectedPost,
  mode,
  activeFolderId,
  hasFolders,
  categories,
  tags,
  folderOptions,
  onDirtyChange,
  registerBeforeLeave,
  onDeletePost,
  onCreateNew,
}: ContentEditorShellProps) {
  const beforeLeaveRef = useRef<BeforeLeaveHandler>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<AdminPostPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleRegisterBeforeLeave = useCallback(
    (handler: BeforeLeaveHandler) => {
      beforeLeaveRef.current = handler;
      registerBeforeLeave(handler);
    },
    [registerBeforeLeave],
  );

  const handlePreview = useCallback(async () => {
    setPreviewOpen(true);
    setPreviewing(true);
    setPreviewError(null);

    try {
      const postId =
        selectedPost?.id ??
        new URLSearchParams(window.location.search).get("postId");

      if (!postId) {
        throw new Error("请先等待新文章完成首次自动保存，再打开预览。");
      }

      const ready = await beforeLeaveRef.current?.();
      if (ready === false) {
        setPreviewOpen(false);
        return;
      }

      setPreview(await getPostPreview(postId));
    } catch (error) {
      setPreview(null);
      setPreviewError(
        error instanceof Error && error.message
          ? error.message
          : "预览生成失败，请稍后重试。",
      );
    } finally {
      setPreviewing(false);
    }
  }, [selectedPost?.id]);

  if (!selectedPost && mode !== "new") {
    return (
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <PostsEmptyState
          title="选择一篇文章继续"
          description={
            hasFolders
              ? "左侧负责定位结构，中栏负责切换上下文，右侧专心写作。"
              : "先创建一个文件夹，文章必须归属到文件夹后才能开始编辑。"
          }
          className="max-w-sm"
          size="lg"
          icon={null}
        >
          <Button
            onClick={() => void onCreateNew()}
            disabled={!hasFolders}
            title={!hasFolders ? "请先创建文件夹" : undefined}
          >
            新建文章
          </Button>
        </PostsEmptyState>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <PostForm
        key={selectedPost?.id ?? `new:${activeFolderId ?? "root"}`}
        post={selectedPost}
        categories={categories}
        tags={tags}
        folderOptions={folderOptions}
        defaultFolderId={selectedPost?.folder?.id ?? activeFolderId}
        onDirtyChange={onDirtyChange}
        registerBeforeLeave={handleRegisterBeforeLeave}
        onDeletePost={onDeletePost}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute bottom-5 right-5 z-20 shadow-lg"
        disabled={previewing}
        onClick={() => void handlePreview()}
      >
        <Eye className="size-4" />
        {previewing ? "生成中..." : "预览"}
      </Button>

      <PostPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        loading={previewing}
        error={previewError}
      />
    </div>
  );
}
