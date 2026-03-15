"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import { deleteMedia } from "@/features/media/actions/media.actions";
import { MediaGrid } from "./media-grid";
import { MediaUploadZone } from "./media-upload-zone";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

type FilterType = "all" | "image" | "file";

type MediaLibraryProps = {
  initialItems: MediaItem[];
};

export function MediaLibrary({ initialItems }: MediaLibraryProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filteredItems = initialItems.filter((item) => {
    if (filter === "image") return item.mimeType.startsWith("image/");
    if (filter === "file") return !item.mimeType.startsWith("image/");
    return true;
  });

  async function handleDeleteConfirmed() {
    if (!confirmId) return;
    await deleteMedia(confirmId);
    router.refresh();
  }

  function handleUploadComplete() {
    setShowUpload(false);
    router.refresh();
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

        <div className="mb-4 flex gap-1">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
          <span className="ml-2 flex items-center text-xs text-muted-foreground">
            {filteredItems.length} 项
          </span>
        </div>

        <MediaGrid items={filteredItems} onDelete={(id) => setConfirmId(id)} />
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
    </div>
  );
}
