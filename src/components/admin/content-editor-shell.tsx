"use client";

import { PostForm } from "@/components/admin/post-form";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { Button } from "@/shared/ui/button";
import type {
  AdminCategory,
  AdminTag,
  ContentSpaceSelectedPost,
} from "./content-space-types";

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
  registerBeforeLeave: (handler: (() => Promise<boolean>) | null) => void;
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
    <div className="flex h-full flex-col">
      <PostForm
        key={`${selectedPost?.id ?? "new"}:${selectedPost?.updatedAt ?? activeFolderId ?? "root"}`}
        post={selectedPost}
        categories={categories}
        tags={tags}
        folderOptions={folderOptions}
        defaultFolderId={selectedPost?.folder?.id ?? activeFolderId}
        onDirtyChange={onDirtyChange}
        registerBeforeLeave={registerBeforeLeave}
        onDeletePost={onDeletePost}
      />
    </div>
  );
}
