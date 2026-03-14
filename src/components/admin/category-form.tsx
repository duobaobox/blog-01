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
import slugify from "slugify";

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
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug || slugify(name, { lower: true, strict: true }));
    formData.set("description", description);

    if (category) {
      await updateCategory(category.id, formData);
    } else {
      await createCategory(formData);
    }
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!category || !confirm("确定删除此分类？")) return;
    await deleteCategory(category.id);
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
            if (!category)
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
