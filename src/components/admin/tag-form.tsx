"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTag, updateTag, deleteTag } from "@/actions/tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import slugify from "slugify";

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
  const [slug, setSlug] = useState(tag?.slug ?? "");
  const [description, setDescription] = useState(tag?.description ?? "");
  const [color, setColor] = useState(tag?.color ?? "#6366f1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug || slugify(name, { lower: true, strict: true }));
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
          onChange={(e) => {
            setName(e.target.value);
            if (!tag)
              setSlug(slugify(e.target.value, { lower: true, strict: true }));
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">颜色</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer p-1"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1"
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
