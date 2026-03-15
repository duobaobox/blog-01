"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/features/taxonomy/actions/category.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  onClose: () => void;
}

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);

    if (category) {
      await updateCategory(category.id, formData);
    } else {
      await createCategory(formData);
    }
    onClose();
    router.refresh();
  }

  async function handleDeleteConfirmed() {
    if (!category) return;
    await deleteCategory(category.id);
    onClose();
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">名称</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <div className="rounded-lg border bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
            {category?.slug ?? "创建后自动生成短链接 ID"}
          </div>
          <p className="text-xs text-muted-foreground">
            {category
              ? "Slug 已固定，更新名称不会影响已发布链接。"
              : "创建后会自动生成稳定的短链接标识，例如 c-8f3k2m1q。"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{category ? "更新" : "创建"}</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          {category && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              className="ml-auto"
            >
              删除
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除分类"
        description="确定删除此分类？此操作不可撤销。"
        confirmText="删除"
        variant="destructive"
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
}
