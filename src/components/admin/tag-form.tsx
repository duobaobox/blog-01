"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTag,
  updateTag,
  deleteTag,
} from "@/features/taxonomy/actions/tag.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { normalizeTagColor } from "@/features/taxonomy/lib/tag-color";

interface TagFormProps {
  tag?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
  };
  onClose: () => void;
}

export function TagForm({ tag, onClose }: TagFormProps) {
  const router = useRouter();
  const [name, setName] = useState(tag?.name ?? "");
  const [description, setDescription] = useState(tag?.description ?? "");
  const [color, setColor] = useState(tag?.color ?? "");
  const colorPreview = normalizeTagColor(color) ?? "#6366f1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("color", color);

    if (tag) {
      await updateTag(tag.id, formData);
    } else {
      await createTag(formData);
    }
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!tag || !confirm("确定删除此标签？")) return;
    await deleteTag(tag.id);
    onClose();
    router.refresh();
  }

  return (
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
          {tag?.slug ?? "创建后自动生成短链接 ID"}
        </div>
        <p className="text-xs text-muted-foreground">
          {tag
            ? "Slug 已固定，更新名称不会影响已有标签链接。"
            : "创建后会自动生成稳定的短链接标识，例如 t-7d4a9c2e。"}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">颜色</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            type="color"
            value={colorPreview}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer p-1"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1"
            placeholder="#6366f1（选填）"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>预览</span>
          <TagBadge
            name={name.trim() || "标签预览"}
            color={normalizeTagColor(color)}
          />
        </div>
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
        <Button type="submit">{tag ? "更新" : "创建"}</Button>
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        {tag && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="ml-auto"
          >
            删除
          </Button>
        )}
      </div>
    </form>
  );
}
