import Link from "next/link";
import { notFound } from "next/navigation";
import { PostsPagination } from "@/components/blog/posts-pagination";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { assignMotifIndices } from "@/features/posts/lib/card-motif-assignment";
import { resolvePublicPostsPage } from "@/features/posts/lib/public-posts-page";
import { getPublicCategoryBySlug } from "@/features/taxonomy/queries/category.queries";
import { generateSeo } from "@/infrastructure/seo";
import { Separator } from "@/shared/ui/separator";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return { title: "分类未找到" };
  }

  return generateSeo({
    title: `分类：${category.name}`,
    description:
      category.description || `浏览“${category.name}”分类下的已发布文章。`,
    url: `/blog/categories/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ slug }, currentSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const pageData = await resolvePublicPostsPage({
    page: currentSearchParams.page,
    categoryId: category.id,
  });

  if (!pageData.isValidPage || pageData.isOutOfRange) {
    notFound();
  }

  const { posts, totalPages, totalPosts, currentPage } = pageData;
  const motifIndices = assignMotifIndices(posts.map((post) => post.slug));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        分类：{category.name}
      </h1>
      {category.description ? (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      ) : null}
      <Separator className="my-6" />

      <div className="space-y-6">
        {posts.length === 0 ? (
          <PostsEmptyState
            title="这个分类下还没有文章"
            description={`“${category.name}”相关的内容还在整理中。`}
            className="py-14"
            icon={null}
          />
        ) : (
          <>
            {posts.map((post, index) => (
              <PostListCard
                key={post.slug}
                post={post}
                showCategory={false}
                motifIndex={motifIndices[index]}
              />
            ))}
            <PostsPagination
              pathname={`/blog/categories/${category.slug}`}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalPosts}
            />
          </>
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 返回博客
        </Link>
      </div>
    </div>
  );
}
