"use client";

import { LoaderCircle } from "lucide-react";
import {
  PostArticleView,
  type PostArticleCategory,
  type PostArticleTag,
} from "@/components/blog/post-article-view";
import type { TocItem } from "@/features/editor/content-types";
import { getPostStatusLabel } from "@/features/posts/lib/post-status";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export type AdminPostPreview = {
  id: string;
  title: string;
  status: string;
  coverImageUrl: string | null;
  authorName: string;
  displayDate: string | null;
  category: PostArticleCategory | null;
  tags: PostArticleTag[];
  contentHtml: string;
  contentToc: TocItem[];
  readingTimeMinutes: number;
  wordCount: number;
};

type PostPreviewDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  preview: AdminPostPreview | null;
  loading: boolean;
  error: string | null;
};

export function PostPreviewDialog({
  open,
  onOpenChange,
  preview,
  loading,
  error,
}: PostPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <div className="flex items-center gap-3">
            <DialogTitle>文章预览</DialogTitle>
            {preview ? (
              <Badge variant="secondary">
                {getPostStatusLabel({ status: preview.status })}
              </Badge>
            ) : null}
          </div>
          <DialogDescription>
            预览使用最近一次成功保存的正文，并与公开文章页共用同一套展示组件。
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          {loading ? (
            <div className="flex min-h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              正在生成预览...
            </div>
          ) : error ? (
            <div className="flex min-h-full items-center justify-center px-6 text-center text-sm text-destructive">
              {error}
            </div>
          ) : preview ? (
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
              <PostArticleView
                title={preview.title}
                coverImageUrl={preview.coverImageUrl}
                category={preview.category}
                authorName={preview.authorName}
                displayDate={preview.displayDate}
                readingTimeMinutes={preview.readingTimeMinutes}
                wordCount={preview.wordCount}
                tags={preview.tags}
                contentHtml={preview.contentHtml}
                toc={preview.contentToc}
                contentRootId={`post-preview-content-${preview.id}`}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
