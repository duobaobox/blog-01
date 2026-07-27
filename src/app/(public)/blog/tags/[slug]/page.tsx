import Link from "next/link";
import { notFound } from "next/navigation";
import { PostsPagination } from "@/components/blog/posts-pagination";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { assignMotifIndices } from "@/features/posts/lib/card-motif-assignment";
import { resolvePublicPostsPage } from "@/features/posts/lib/public-posts-page";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { getPublicTagBySlug } from "@/features/taxonomy/queries/tag.queries";
import { generateSeo } from "@/infrastructure/seo";
import { Separator } from "@/shared/ui/separator";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getPublicTagBySlug(slug);

  if (!tag) {
    return { title: "标签未找到" };
  }

  return generateSeo({
    title: `标签：${tag.name}`,
    description: tag.description || `浏览和“${tag.name}”相关的已发布文章。`,
    url: `/blog/tags/${tag.slug}`,
  });
}

export default async function TagPage({
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
  const tag = await getPublicTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const pageData = await resolvePublicPostsPage({
    page: currentSearchParams.page,
    tagId: tag.id,
  });

  if (!pageData.isValidPage || pageData.isOutOfRange) {
    notFound();
  }

  const { posts, totalPages, totalPosts, currentPage } = pageData;
  const motifIndices = assignMotifIndices(posts.map((post) => post.slug));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">标签</h1>
        <TagBadge name={tag.name} color={tag.color} className="text-sm" />
      </div>
      {tag.description ? (
        <p className="mt-2 text-muted-foreground">{tag.description}</p>
      ) : null}
      <Separator className="my-6" />

      <div className="space-y-6">
        {posts.length === 0 ? (
          <PostsEmptyState
            title="这个标签下还没有文章"
            description={`和“${tag.name}”相关的内容还在整理中。`}
            className="py-14"
            icon={null}
          />
        ) : (
          <>
            {posts.map((post, index) => (
              <PostListCard
                key={post.slug}
                post={post}
                motifIndex={motifIndices[index]}
              />
            ))}
            <PostsPagination
              pathname={`/blog/tags/${tag.slug}`}
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
