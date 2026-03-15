export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/shared/ui/separator";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { getPosts } from "@/features/posts/queries/post.queries";
import { getCategoryBySlug } from "@/features/taxonomy/queries/category.queries";
import { generateSeo } from "@/infrastructure/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "分类未找到" };
  return generateSeo({
    title: `分类: ${category.name}`,
    description:
      category.description || `浏览“${category.name}”分类下的已发布文章。`,
    url: `/blog/categories/${category.slug}`,
  });
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
    order: "published",
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

      <div className="space-y-6">
        {posts.length === 0 ? (
          <PostsEmptyState
            title="这个分类下还没有文章"
            description={`“${category.name}” 相关的内容还在整理中。`}
            className="py-14"
            icon={null}
          />
        ) : (
          posts.map((post) => (
            <PostListCard key={post.slug} post={post} showCategory={false} />
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
