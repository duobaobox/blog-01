"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type MediaReference = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
  usage: Array<"cover" | "content">;
};

type MediaReferencesDialogProps = {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatUsageLabel(usage: MediaReference["usage"][number]) {
  return usage === "cover" ? "封面" : "正文";
}

export function MediaReferencesDialog({
  item,
  open,
  onOpenChange,
}: MediaReferencesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [references, setReferences] = useState<MediaReference[]>([]);

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    const currentItem = item;
    let cancelled = false;

    async function loadReferences() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/media/${currentItem.id}/references`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "加载引用失败");
        }

        if (!cancelled) {
          setReferences(data.references ?? []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "加载引用失败",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, [item, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(42rem,calc(100vw-2rem))] max-w-none overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>查看引用</DialogTitle>
          <DialogDescription>
            {item ? `${item.filename} 当前被哪些文章使用。` : "查看媒体引用。"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 px-6 py-10 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            正在加载引用...
          </div>
        ) : error ? (
          <div className="mx-6 mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : references.length === 0 ? (
          <div className="mx-6 mb-6 rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            当前还没有文章引用这个文件。
          </div>
        ) : (
          <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto px-6 pb-6">
            {references.map((reference) => (
              <Link
                key={reference.id}
                href={`/admin/posts?postId=${reference.id}`}
                className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 overflow-hidden rounded-xl border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="line-clamp-2 pr-2 text-[15px] font-medium leading-snug">
                    {reference.title}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">
                      {reference.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                    {reference.folder ? (
                      <Badge variant="secondary">{reference.folder.name}</Badge>
                    ) : null}
                    {reference.usage.map((usage) => (
                      <Badge key={usage} variant="ghost">
                        {formatUsageLabel(usage)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
