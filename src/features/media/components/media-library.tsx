"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import { deleteMedia } from "@/features/media/actions/media.actions";
import { MediaGrid } from "./media-grid";
import { MediaReferencesDialog } from "./media-references-dialog";
import { MediaUploadZone } from "./media-upload-zone";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/shared/lib/utils";

type FilterType = "all" | "image" | "file";

type MediaLibraryProps = {
  initialItems: MediaItem[];
};

type FeedbackState = {
  tone: "success" | "error" | "info";
  message: string;
};

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

export function MediaLibrary({ initialItems }: MediaLibraryProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activeReferenceItem, setActiveReferenceItem] = useState<MediaItem | null>(
    null,
  );
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredItems = initialItems.filter((item) => {
    if (filter === "image") return item.mimeType.startsWith("image/");
    if (filter === "file") return !item.mimeType.startsWith("image/");
    return true;
  });

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function showFeedback(next: FeedbackState) {
    setFeedback(next);

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 2600);
  }

  async function handleDeleteConfirmed() {
    if (!confirmId) return;
    try {
      await deleteMedia(confirmId);
      router.refresh();
      showFeedback({
        tone: "success",
        message: "文件已删除。",
      });
    } catch (error) {
      showFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "删除失败，请稍后重试。",
      });
    } finally {
      setConfirmId(null);
    }
  }

  function handleUploadComplete() {
    setShowUpload(false);
    router.refresh();
  }

  async function handleCopyLink(item: MediaItem) {
    const absoluteUrl = new URL(item.url, window.location.origin).toString();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteUrl);
      } else if (!fallbackCopyText(absoluteUrl)) {
        throw new Error("copy_failed");
      }
      showFeedback({
        tone: "success",
        message: "媒体链接已复制。",
      });
    } catch {
      if (fallbackCopyText(absoluteUrl)) {
        showFeedback({
          tone: "success",
          message: "媒体链接已复制。",
        });
        return;
      }

      showFeedback({
        tone: "error",
        message: "复制失败，请稍后重试。",
      });
    }
  }

  async function handleReplace(item: MediaItem, file: File) {
    setReplacingId(item.id);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch(`/api/media/${item.id}/replace`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.media) {
        throw new Error(data.error || "替换失败");
      }

      router.refresh();
      showFeedback({
        tone: "success",
        message: "文件已替换，已有文章引用会继续复用原链接。",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "替换失败";
      showFeedback({
        tone: "error",
        message,
      });
    } finally {
      setReplacingId(null);
    }
  }

  const filters: { label: string; value: FilterType }[] = [
    { label: "全部", value: "all" },
    { label: "图片", value: "image" },
    { label: "文件", value: "file" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1680px] p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">媒体库</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              管理上传的图片和文件
            </p>
          </div>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="mr-1.5 size-4" />
            上传
          </Button>
        </div>

        {showUpload && (
          <div className="mb-6">
            <MediaUploadZone onUploadComplete={handleUploadComplete} />
          </div>
        )}

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <div className="mb-4 flex items-center gap-4">
            <TabsList>
              {filters.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <span className="text-xs text-muted-foreground">
              {filteredItems.length} 项
            </span>
          </div>
        </Tabs>

        {feedback ? (
          <div
            className={cn(
              "mb-4 rounded-lg border px-3 py-2 text-sm",
              feedback.tone === "success" &&
                "border-emerald-200 bg-emerald-50 text-emerald-900",
              feedback.tone === "error" &&
                "border-destructive/30 bg-destructive/5 text-destructive",
              feedback.tone === "info" &&
                "border-border bg-muted/50 text-foreground",
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <MediaGrid
          items={filteredItems}
          onDelete={(id) => setConfirmId(id)}
          onCopyLink={handleCopyLink}
          onViewReferences={(item) => setActiveReferenceItem(item)}
          onReplace={handleReplace}
        />
        {replacingId ? (
          <p className="mt-3 text-xs text-muted-foreground">
            正在替换文件...
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="删除文件"
        description="确定删除这个文件吗？此操作不可撤销。"
        confirmText="删除"
        variant="destructive"
        onConfirm={handleDeleteConfirmed}
      />

      <MediaReferencesDialog
        item={activeReferenceItem}
        open={!!activeReferenceItem}
        onOpenChange={(open) => {
          if (!open) {
            setActiveReferenceItem(null);
          }
        }}
      />
    </div>
  );
}
