export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { parseToc } from "@/features/editor/content-types";
import { getPostBySlug } from "@/features/posts/queries/post.queries";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { generateSeo } from "@/infrastructure/seo";
import { TableOfContents } from "@/components/blog/table-of-contents";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") {
    return { title: "文章未找到" };
  }

  return generateSeo({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || post.contentText.slice(0, 160),
    image: post.coverImageUrl ?? undefined,
    url: post.canonicalUrl || `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") notFound();

  const toc = parseToc(post.contentToc);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回博客
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_200px]">
        <article className="min-w-0">
          <header className="mb-8">
            {post.coverImageUrl ? (
              <div className="mb-6 overflow-hidden rounded-2xl border bg-muted/30">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  width={1600}
                  height={900}
                  unoptimized
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : null}
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
                  <TagBadge name={pt.tag.name} color={pt.tag.color} />
                </Link>
              ))}
            </div>
          </header>

          <Separator className="mb-8" />

          <div
            className="article-prose editor-prose prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>

        {/* 文章目录 */}
        {toc.length > 0 && <TableOfContents toc={toc} />}
      </div>
    </div>
  );
}
