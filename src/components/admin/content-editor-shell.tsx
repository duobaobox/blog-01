"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, FolderKanban, Layers3 } from "lucide-react";
import { PostForm } from "@/components/admin/post-form";
import { buildContentSpaceEditorNavigation } from "@/features/content-space/lib/content-space-editor-navigation";
import { buildContentSpaceEditorOutline } from "@/features/content-space/lib/content-space-editor-outline";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { getPostDisplayTitle } from "@/features/posts/lib/post-title";
import { Button } from "@/shared/ui/button";
import type {
  AdminCategory,
  ContentSpaceContextPost,
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
  contextPosts: ContentSpaceContextPost[];
  onCreateNew: () => void | Promise<void>;
  onSelectPost: (postId: string) => void | Promise<void>;
  onReturnToStructure: () => void | Promise<void>;
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
  contextPosts,
  onCreateNew,
  onSelectPost,
  onReturnToStructure,
}: ContentEditorShellProps) {
  function formatOutlineDate(value: Date | string) {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  const activeTopic = selectedPost?.subtopic?.topic ?? contextTopic;
  const activeSubtopic = selectedPost?.subtopic ?? contextSubtopic;
  const navigation = buildContentSpaceEditorNavigation({
    contextPosts,
    selectedPostId: selectedPost?.id,
  });
  const outline = buildContentSpaceEditorOutline({
    contextPosts,
    selectedPostId: selectedPost?.id,
  });

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
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex flex-wrap items-center gap-2">
            {(activeSubtopic || activeTopic) && selectedPost ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => void onReturnToStructure()}
              >
                <ArrowLeft className="size-3.5" />
                返回当前结构
              </Button>
            ) : null}
            {navigation.previousPost ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 max-w-[220px] justify-start gap-1.5 px-2.5 text-xs"
                onClick={() => void onSelectPost(navigation.previousPost!.id)}
                title={`上一篇：${navigation.previousPost.title}`}
              >
                <ChevronLeft className="size-3.5" />
                <span className="truncate">上一篇：{navigation.previousPost.title}</span>
              </Button>
            ) : null}
            {navigation.nextPost ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 max-w-[220px] justify-start gap-1.5 px-2.5 text-xs"
                onClick={() => void onSelectPost(navigation.nextPost!.id)}
                title={`下一篇：${navigation.nextPost.title}`}
              >
                <span className="truncate">下一篇：{navigation.nextPost.title}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </div>

        {outline && outline.total > 1 ? (
          <div className="mt-3 rounded-lg border bg-background/80 px-3 py-2">
            <div className="mb-2 text-[11px] font-medium text-muted-foreground">
              当前分支 · 第 {outline.activeIndex + 1} / 共 {outline.total} 篇
            </div>
            <div className="flex flex-wrap gap-2">
              {outline.items.map((item, index) => {
                const active = item.id === selectedPost?.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void onSelectPost(item.id)}
                    className={
                      active
                        ? "flex max-w-[260px] items-center gap-2 rounded-full border border-accent bg-accent/60 px-2.5 py-1 text-xs font-medium text-foreground"
                        : "flex max-w-[260px] items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                    }
                    title={`${index + 1}. ${getPostDisplayTitle(item.title)}`}
                  >
                    <span
                      className={
                        item.status === "published"
                          ? "h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                          : "h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                      }
                    />
                    <span className="truncate">
                      {index + 1}. {getPostDisplayTitle(item.title)}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground/80">
                      {formatOutlineDate(item.updatedAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
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
