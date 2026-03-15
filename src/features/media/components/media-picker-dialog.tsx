"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import type { MediaItem } from "@/features/media/types/storage.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { MediaGrid } from "./media-grid";
import { MediaUploadZone } from "./media-upload-zone";

type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaItem) => void;
  mimeTypePrefix?: string;
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  mimeTypePrefix = "image",
}: MediaPickerDialogProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [justUploaded, setJustUploaded] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedItem(null);
      setJustUploaded(null);
      setActiveTab("library");
      return;
    }
    fetchMedia();
  }, [open]);

  async function fetchMedia() {
    setLoading(true);
    try {
      const params = mimeTypePrefix ? `?mimeTypePrefix=${mimeTypePrefix}` : "";
      const res = await fetch(`/api/media${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (selectedItem) {
      onSelect(selectedItem);
      onOpenChange(false);
    }
  }

  function handleItemDoubleClick(media: MediaItem) {
    onSelect(media);
    onOpenChange(false);
  }

  function handleUploadComplete(media: MediaItem) {
    setItems((prev) => [media, ...prev]);
    setSelectedItem(media);
    setJustUploaded(media);
    // 300ms 后自动切换到媒体库，让用户看到上传成功的状态
    setTimeout(() => {
      setActiveTab("library");
      setJustUploaded(null);
    }, 1200);
  }

  const isImage = (item: MediaItem) => item.mimeType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择媒体</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "library" | "upload")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="library">媒体库</TabsTrigger>
            <TabsTrigger value="upload">上传文件</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <MediaGrid
                  items={items}
                  selectedId={selectedItem?.id}
                  onSelect={(item) =>
                    setSelectedItem(
                      item.id === selectedItem?.id ? null : item,
                    )
                  }
                  onDoubleClick={handleItemDoubleClick}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            {justUploaded ? (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
                <CheckCircle2 className="size-8 text-green-500" />
                {isImage(justUploaded) ? (
                  <img
                    src={justUploaded.url}
                    alt={justUploaded.filename}
                    className="h-32 max-w-full rounded-lg border object-contain shadow-sm"
                  />
                ) : null}
                <div className="text-center">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    上传成功
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {justUploaded.filename} · 正在切换到媒体库...
                  </p>
                </div>
              </div>
            ) : (
              <MediaUploadZone
                onUploadComplete={handleUploadComplete}
                accept={
                  mimeTypePrefix === "image"
                    ? "image/*"
                    : "image/*,.pdf,.zip,.svg"
                }
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="items-center">
          {selectedItem && (
            <p className="mr-auto text-xs text-muted-foreground">
              已选：{selectedItem.filename}
            </p>
          )}
          <Button disabled={!selectedItem} onClick={handleConfirm}>
            确认选择
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
