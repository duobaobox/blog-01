"use client";

import { useState, useRef } from "react";
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
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { normalizeTagColor } from "@/features/taxonomy/lib/tag-color";
import { cn } from "@/shared/lib/utils";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#374151",
];

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colorPreview = normalizeTagColor(color) ?? "#6366f1";
  const isCustomColor = color && !PRESET_COLORS.includes(color);

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

  async function handleDeleteConfirmed() {
    if (!tag) return;
    await deleteTag(tag.id);
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
          <Label htmlFor="color">颜色</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "size-6 rounded-md border-2 transition-transform hover:scale-110",
                  colorPreview === c && !isCustomColor
                    ? "border-foreground/50 scale-110"
                    : "border-transparent",
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            {/* 自定义颜色按钮 */}
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className={cn(
                "relative size-6 overflow-hidden rounded-md border-2 transition-transform hover:scale-110",
                isCustomColor
                  ? "border-foreground/50 scale-110"
                  : "border-transparent",
              )}
              style={isCustomColor ? { backgroundColor: color } : undefined}
              title="自定义颜色"
            >
              {!isCustomColor && (
                <span
                  className="absolute inset-0 rounded-[4px]"
                  style={{
                    background:
                      "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                  }}
                />
              )}
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={colorPreview}
              onChange={(e) => setColor(e.target.value)}
              className="sr-only"
              tabIndex={-1}
            />
            {/* 清除按钮 */}
            <button
              type="button"
              onClick={() => setColor("")}
              className={cn(
                "size-6 rounded-md border-2 bg-muted text-[10px] text-muted-foreground transition-transform hover:scale-110",
                !color
                  ? "border-foreground/50 scale-110"
                  : "border-transparent",
              )}
              title="清除颜色"
            >
              ✕
            </button>
          </div>
          <Input
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366f1（选填，也可手动输入 hex）"
          />
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
        title="删除标签"
        description="确定删除此标签？此操作不可撤销。"
        confirmText="删除"
        variant="destructive"
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
}
