"use client";

import Image from "next/image";
import { FileIcon, Trash2 } from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import { cn } from "@/shared/lib/utils";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type MediaGridItemProps = {
  item: MediaItem;
  isSelected?: boolean;
  onSelect?: (item: MediaItem) => void;
  onDoubleClick?: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
};

export function MediaGridItem({
  item,
  isSelected = false,
  onSelect,
  onDoubleClick,
  onDelete,
}: MediaGridItemProps) {
  const isImage = item.mimeType.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg border bg-muted/30 transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary border-primary",
      )}
      title={onDoubleClick ? `${item.filename}（双击直接插入）` : item.filename}
      onClick={() => onSelect?.(item)}
      onDoubleClick={() => onDoubleClick?.(item)}
    >
      <div className="relative aspect-square">
        {isImage ? (
          <Image
            src={item.url}
            alt={item.alt || item.filename}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
            <FileIcon className="size-10 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {item.filename.split(".").pop()}
            </span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs text-white">{item.filename}</p>
        <p className="text-xs text-white/70">{formatFileSize(item.size)}</p>
      </div>

      {onDelete && (
        <button
          type="button"
          className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      {isSelected && (
        <div className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
