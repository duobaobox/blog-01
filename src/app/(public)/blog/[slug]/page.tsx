export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { getPostBySlug } from "@/features/posts/queries/post.queries";
import { renderMarkdown, extractToc } from "@/infrastructure/markdown";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: post.seoTitle || post.title,
    description:
      post.seoDescription || post.excerpt || post.contentMarkdown.slice(0, 160),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") notFound();

  const html = await renderMarkdown(post.contentMarkdown);
  const toc = extractToc(post.contentMarkdown);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回博客
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_200px]">
        <article>
          <header className="mb-8">
            {post.category && (
              <div className="mb-3 flex items-center gap-2">
                <Link href={`/blog/categories/${post.category.slug}`}>
                  <Badge variant="secondary">{post.category.name}</Badge>
                </Link>
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {post.author.name}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("zh-CN")
                  : new Date(post.createdAt).toLocaleDateString("zh-CN")}
              </span>
              {post.readingTimeMinutes && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTimeMinutes} 分钟
                </span>
              )}
              {post.wordCount && <span>{post.wordCount} 字</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((pt) => (
                <Link key={pt.tag.id} href={`/blog/tags/${pt.tag.slug}`}>
                  <Badge variant="outline" className="text-xs">
                    {pt.tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </header>

          <Separator className="mb-8" />

          <div
            className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        {/* 文章目录 */}
        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <h3 className="mb-3 text-sm font-semibold">目录</h3>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm text-muted-foreground transition-colors hover:text-foreground ${
                      item.level === 3 ? "pl-4" : ""
                    }`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
