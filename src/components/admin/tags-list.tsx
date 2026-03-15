"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { TagForm } from "./tag-form";

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  _count: { posts: number };
}

export function TagsList({ tags }: { tags: Tag[] }) {
  const [editing, setEditing] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);

  const open = creating || editing !== null;

  function handleClose() {
    setCreating(false);
    setEditing(null);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1680px] p-4 md:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">标签管理</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              管理文章的标签，标签可以跨分类关联相关内容
            </p>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            新建标签
          </Button>
        </div>

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">名称</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">颜色</th>
                <th className="px-4 py-3 text-left font-medium">文章数</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    暂无标签，点击右上角新建一个
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{tag.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tag.slug}
                    </td>
                    <td className="px-4 py-3">
                      {tag.color ? (
                        <div className="flex items-center gap-2">
                          <TagBadge name={tag.name} color={tag.color} />
                          <span className="text-xs text-muted-foreground">
                            {tag.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tag._count.posts}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCreating(false);
                          setEditing(tag);
                        }}
                      >
                        编辑
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑标签" : "新建标签"}</DialogTitle>
          </DialogHeader>
          <TagForm tag={editing ?? undefined} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
