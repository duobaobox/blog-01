"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { fetchMediaPickerItems } from "@/features/media/lib/media-picker-client";
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
import { DEFAULT_MEDIA_ACCEPT } from "@/features/media/config/upload.config";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [justUploaded, setJustUploaded] = useState<MediaItem | null>(null);
  const uploadResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  const fetchMedia = useCallback(async () => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    setLoading(true);
    setLoadError(null);

    try {
      const nextItems = await fetchMediaPickerItems({
        mimeTypePrefix,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setItems(nextItems);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setItems([]);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : "媒体库加载失败，请稍后重试。",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [mimeTypePrefix]);

  useEffect(() => {
    if (!open) {
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;

      if (uploadResetTimerRef.current) {
        clearTimeout(uploadResetTimerRef.current);
        uploadResetTimerRef.current = null;
      }

      setSelectedItem(null);
      setJustUploaded(null);
      setActiveTab("library");
      setLoadError(null);
      return;
    }

    void fetchMedia();

    return () => {
      requestControllerRef.current?.abort();
    };
  }, [fetchMedia, open]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
      if (uploadResetTimerRef.current) {
        clearTimeout(uploadResetTimerRef.current);
      }
    };
  }, []);

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
    setItems((previousItems) => [
      media,
      ...previousItems.filter((item) => item.id !== media.id),
    ]);
    setSelectedItem(media);
    setJustUploaded(media);
    setLoadError(null);

    if (uploadResetTimerRef.current) {
      clearTimeout(uploadResetTimerRef.current);
    }

    uploadResetTimerRef.current = setTimeout(() => {
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
          onValueChange={(value) =>
            setActiveTab(value as "library" | "upload")
          }
        >
          <TabsList className="w-full">
            <TabsTrigger value="library">媒体库</TabsTrigger>
            <TabsTrigger value="upload">上传文件</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="mr-2 size-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">加载媒体库...</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-10 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="mt-3 text-sm font-medium">媒体库加载失败</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                  {loadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void fetchMedia()}
                >
                  <RefreshCw />
                  重新加载
                </Button>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <MediaGrid
                  items={items}
                  selectedId={selectedItem?.id}
                  onSelect={(item) =>
                    setSelectedItem(item.id === selectedItem?.id ? null : item)
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
                  <div className="relative h-32 w-full overflow-hidden rounded-lg border shadow-sm">
                    <Image
                      src={justUploaded.url}
                      alt={justUploaded.filename}
                      fill
                      sizes="(min-width: 640px) 32rem, 100vw"
                      className="object-contain"
                    />
                  </div>
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
                  mimeTypePrefix === "image" ? "image/*" : DEFAULT_MEDIA_ACCEPT
                }
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="items-center">
          {selectedItem ? (
            <p className="mr-auto text-xs text-muted-foreground">
              已选：{selectedItem.filename}
            </p>
          ) : null}
          <Button disabled={!selectedItem} onClick={handleConfirm}>
            确认选择
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
