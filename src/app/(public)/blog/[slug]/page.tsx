import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostArticleView } from "@/components/blog/post-article-view";
import { ArticleJsonLd } from "@/components/blog/article-json-ld";
import { parseToc } from "@/features/editor/content-types";
import {
  getPostDisplayDate,
  isPublishedPost,
} from "@/features/posts/lib/post-status";
import {
  getPostBySlug,
  getPublishedSlugs,
} from "@/features/posts/queries/post.queries";
import { generateSeo } from "@/infrastructure/seo";
import { getResolvedSiteConfig } from "@/features/settings/queries/site-config.query";

export const revalidate = 300;

export async function generateStaticParams() {
  let posts: Awaited<ReturnType<typeof getPublishedSlugs>> = [];

  try {
    posts = await getPublishedSlugs();
  } catch {
    return [];
  }

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !isPublishedPost(post)) {
    return { title: "文章未找到" };
  }

  return generateSeo({
    title: post.seoTitle || post.title,
    description:
      post.seoDescription || post.excerpt || post.contentText.slice(0, 160),
    image: post.coverImageUrl ?? undefined,
    url: post.canonicalUrl || `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: post.updatedAt?.toISOString(),
    imageAlt: post.coverImage?.alt ?? post.title,
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, site] = await Promise.all([
    getPostBySlug(slug),
    getResolvedSiteConfig(),
  ]);

  if (!post || !isPublishedPost(post)) notFound();

  const displayDate = getPostDisplayDate(post);
  const coverImage = post.coverImage;
  const originalCoverImage = coverImage?.variants?.original ?? coverImage;
  const coverImageUrl = coverImage?.url ?? post.coverImageUrl;
  const articleUrl = new URL(`/blog/${post.slug}`, site.url).toString();
  const articleImageUrl = coverImageUrl
    ? new URL(coverImageUrl, site.url).toString()
    : undefined;

  return (
    <>
      <ArticleJsonLd
        url={articleUrl}
        siteName={site.name}
        title={post.title}
        description={
          post.seoDescription || post.excerpt || post.contentText.slice(0, 160)
        }
        image={articleImageUrl}
        authorName={post.author.name}
        publishedAt={post.publishedAt?.toISOString()}
        modifiedAt={post.updatedAt?.toISOString()}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回博客
        </Link>

        <PostArticleView
          title={post.title}
          coverImageUrl={coverImageUrl}
          coverImageAlt={coverImage?.alt}
          coverImageWidth={originalCoverImage?.width}
          coverImageHeight={originalCoverImage?.height}
          category={post.category}
          authorName={post.author.name}
          displayDate={displayDate}
          readingTimeMinutes={post.readingTimeMinutes}
          wordCount={post.wordCount}
          tags={post.tags.map((item) => item.tag)}
          contentHtml={post.contentHtml}
          toc={parseToc(post.contentToc)}
        />
      </div>
    </>
  );
}
