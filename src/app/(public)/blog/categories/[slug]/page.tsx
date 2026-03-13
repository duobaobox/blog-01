export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCategoryBySlug } from "@/actions/categories";
import { getPosts } from "@/actions/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "分类未找到" };
  return { title: `分类: ${category.name}` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const posts = await getPosts({
    status: "published",
    categoryId: category.id,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        分类: {category.name}
      </h1>
      {category.description && (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      )}
      <Separator className="my-6" />

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            该分类下暂无文章
          </p>
        ) : (
          posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("zh-CN")
                        : new Date(post.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    {post.readingTimeMinutes && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTimeMinutes} 分钟
                        </span>
                      </>
                    )}
                  </div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {post.excerpt ?? post.contentMarkdown.slice(0, 120) + "..."}
                  </CardDescription>
                  <div className="flex items-center gap-2 pt-1">
                    {post.tags.map((pt) => (
                      <Badge
                        key={pt.tag.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {pt.tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回博客
        </Link>
      </div>
    </div>
  );
}
