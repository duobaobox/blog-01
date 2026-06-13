"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFolder,
  renameFolder,
} from "@/features/content-space/actions/folder.actions";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type FolderCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (folder: { id: string; name: string; slug: string }) => void | Promise<void>;
  folder?: {
    id: string;
    name: string;
  };
};

export function FolderCreateDialog({
  open,
  onOpenChange,
  onCreated,
  folder,
}: FolderCreateDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(folder);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
      return;
    }

    setName(folder?.name ?? "");
    setError(null);
  }, [folder?.name, open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      if (folder) {
        await renameFolder(folder.id, formData);
      } else {
        const createdFolder = await createFolder(formData);
        await onCreated?.(createdFolder);
      }
      onOpenChange(false);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "创建文件夹失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "重命名文件夹" : "添加文件夹"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">文件夹名称</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：内容系统"
              required
            />
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            {isEditing
              ? "文件夹名称会同步更新到内容库视图中。"
              : "创建后会立即出现在内容库里，并作为该组文章的唯一容器。"}
          </p>

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEditing
                  ? "更新中..."
                  : "创建中..."
                : isEditing
                  ? "更新文件夹"
                  : "创建文件夹"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
