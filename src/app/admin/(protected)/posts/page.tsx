export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { getPosts } from "@/features/posts/queries/post.queries";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/posts/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            新建文章
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
              <th className="px-4 py-3 text-left text-sm font-medium">分类</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">日期</th>
              <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  暂无文章
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{post.title}</div>
                    {post.isFeatured && (
                      <Badge variant="secondary" className="mt-1">
                        置顶
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {post.category?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                    >
                      {post.status === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/posts/${post.id}`}>
                      <Button variant="ghost" size="sm">
                        编辑
                      </Button>
                    </Link>
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
