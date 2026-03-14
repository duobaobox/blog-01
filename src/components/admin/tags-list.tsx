"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">标签管理</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          新建标签
        </Button>
      </div>

      {(creating || editing) && (
        <div className="mb-6 rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">
            {editing ? "编辑标签" : "新建标签"}
          </h2>
          <TagForm
            tag={editing ?? undefined}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-medium">颜色</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                文章数
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  暂无标签
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{tag.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-3">
                    {tag.color && (
                      <Badge
                        style={{ backgroundColor: tag.color, color: "#fff" }}
                      >
                        {tag.color}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{tag._count.posts}</td>
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
  );
}
