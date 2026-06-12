"use client";

import { FolderKanban, Layers3 } from "lucide-react";
import { PostForm } from "@/components/admin/post-form";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { Button } from "@/shared/ui/button";
import type {
  AdminCategory,
  AdminTag,
  ContentSpaceSelectedPost,
  ContentSpaceSubtopicGroup,
} from "./content-space-types";

type ContentEditorShellProps = {
  selectedPost?: ContentSpaceSelectedPost;
  mode: "new" | "edit";
  categories: AdminCategory[];
  tags: AdminTag[];
  subtopicGroups: ContentSpaceSubtopicGroup[];
  onDirtyChange: (dirty: boolean) => void;
  registerBeforeLeave: (handler: (() => Promise<boolean>) | null) => void;
  contextTopic?: {
    id: string;
    name: string;
    slug: string;
  };
  contextSubtopic?: {
    id: string;
    name: string;
    slug: string;
  };
  onCreateNew: () => void | Promise<void>;
};

export function ContentEditorShell({
  selectedPost,
  mode,
  categories,
  tags,
  subtopicGroups,
  onDirtyChange,
  registerBeforeLeave,
  contextTopic,
  contextSubtopic,
  onCreateNew,
}: ContentEditorShellProps) {
  const activeTopic = selectedPost?.subtopic?.topic ?? contextTopic;
  const activeSubtopic = selectedPost?.subtopic ?? contextSubtopic;

  if (!selectedPost && mode !== "new") {
    return (
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <PostsEmptyState
          title="选择一篇文章继续"
          description="左侧负责定位结构，中栏负责切换上下文，右侧专心写作。"
          className="max-w-sm"
          size="lg"
          icon={null}
        >
          <Button onClick={() => void onCreateNew()}>新建文章</Button>
        </PostsEmptyState>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/20 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
            <FolderKanban className="size-3.5" />
            {activeTopic?.name ?? "未归属专题"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
            <Layers3 className="size-3.5" />
            {activeSubtopic?.name ?? "未归属子专题"}
          </span>
        </div>
      </div>

      <PostForm
        post={selectedPost}
        categories={categories}
        tags={tags}
        subtopicGroups={subtopicGroups}
        defaultSubtopicId={contextSubtopic?.id}
        onDirtyChange={onDirtyChange}
        registerBeforeLeave={registerBeforeLeave}
      />
    </div>
  );
}
