"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  Copy,
  FileIcon,
  Link2,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type MediaGridItemProps = {
  item: MediaItem;
  imagePriority?: boolean;
  isSelected?: boolean;
  onSelect?: (item: MediaItem) => void;
  onDoubleClick?: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
  onCopyLink?: (item: MediaItem) => void;
  onViewReferences?: (item: MediaItem) => void;
  onReplace?: (item: MediaItem, file: File) => void;
};

export function MediaGridItem({
  item,
  imagePriority = false,
  isSelected = false,
  onSelect,
  onDoubleClick,
  onDelete,
  onCopyLink,
  onViewReferences,
  onReplace,
}: MediaGridItemProps) {
  const isImage = item.mimeType.startsWith("image/");
  const replaceInputRef = useRef<HTMLInputElement>(null);

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
            priority={imagePriority}
            loading={imagePriority ? "eager" : "lazy"}
            sizes="(min-width: 1280px) 16rem, (min-width: 768px) 20rem, 50vw"
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

      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="secondary"
                size="icon-xs"
                className="bg-black/55 text-white hover:bg-black/70"
                aria-label={`${item.filename} 操作`}
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink?.(item);
              }}
            >
              <Copy className="size-4" />
              复制链接
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onViewReferences?.(item);
              }}
            >
              <Link2 className="size-4" />
              查看引用
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                replaceInputRef.current?.click();
              }}
            >
              <RefreshCw className="size-4" />
              替换文件
            </DropdownMenuItem>
            {onDelete ? <DropdownMenuSeparator /> : null}
            {onDelete ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
              >
                <Trash2 className="size-4" />
                删除
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept={item.mimeType.startsWith("image/") ? "image/*" : undefined}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            onReplace?.(item, file);
          }
        }}
      />

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
