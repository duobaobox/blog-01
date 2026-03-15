"use client";

import type { MediaItem } from "@/features/media/types/storage.types";
import { MediaGridItem } from "./media-grid-item";

type MediaGridProps = {
  items: MediaItem[];
  selectedId?: string | null;
  onSelect?: (item: MediaItem) => void;
  onDoubleClick?: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
};

export function MediaGrid({
  items,
  selectedId,
  onSelect,
  onDoubleClick,
  onDelete,
}: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">暂无媒体文件</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <MediaGridItem
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
