export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPosts, PostListCard } from "@/features/posts";
import { getCategories, getTags } from "@/features/taxonomy";

export const metadata: Metadata = {
  title: "博客",
  description: "技术文章、项目经验和学习笔记。",
};

export default async function BlogPage() {
  const [posts, categories, tags] = await Promise.all([
    getPosts({ status: "published" }),
    getCategories(),
    getTags(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">博客</h1>
      <p className="mt-2 text-muted-foreground">
        技术文章、项目经验和学习笔记。
      </p>
      <Separator className="my-6" />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Post list */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">暂无文章</p>
          ) : (
            posts.map((post) => <PostListCard key={post.slug} post={post} />)
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold">分类</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog/categories/${cat.slug}`}
                  className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs">{cat._count.posts}</span>
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="px-3 text-xs text-muted-foreground">暂无分类</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-sm font-semibold">标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag.id} href={`/blog/tags/${tag.slug}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer transition-colors hover:bg-accent"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无标签</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
