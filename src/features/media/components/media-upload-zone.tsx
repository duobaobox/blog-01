"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import { DEFAULT_MEDIA_ACCEPT } from "@/features/media/config/upload.config";
import { cn } from "@/shared/lib/utils";

type MediaUploadZoneProps = {
  onUploadComplete: (media: MediaItem) => void;
  accept?: string;
  className?: string;
};

export function MediaUploadZone({
  onUploadComplete,
  accept = DEFAULT_MEDIA_ACCEPT,
  className,
}: MediaUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.media) {
        throw new Error(data.error || "上传失败");
      }

      onUploadComplete(data.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        uploading && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="size-8 text-muted-foreground" />
      {uploading ? (
        <p className="text-sm text-muted-foreground">上传中...</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            拖拽文件到这里，或点击选择
          </p>
          <p className="text-xs text-muted-foreground/70">
            支持图片、PDF、ZIP；上传后会自动保存到站点媒体库
          </p>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
