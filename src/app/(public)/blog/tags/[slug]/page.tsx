import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/shared/ui/separator";
import { PostsPagination } from "@/components/blog/posts-pagination";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { PostListCard } from "@/features/posts/components/post-list-card";
import {
  getPostCount,
  getPosts,
} from "@/features/posts/queries/post.queries";
import {
  getTotalPages,
  parsePageParam,
  PUBLIC_POSTS_PER_PAGE,
} from "@/features/posts/lib/pagination";
import { getTagBySlug } from "@/features/taxonomy/queries/tag.queries";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { generateSeo } from "@/infrastructure/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "标签未找到" };
  return generateSeo({
    title: `标签: ${tag.name}`,
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
  const { slug } = await params;
  const currentSearchParams = await searchParams;
  const currentPage = parsePageParam(currentSearchParams.page);
  if (!currentPage) notFound();

  const tag = await getTagBySlug(slug);

  if (!tag) notFound();

  const totalPosts = await getPostCount({
    status: "published",
    tagId: tag.id,
  });
  const totalPages = getTotalPages(totalPosts, PUBLIC_POSTS_PER_PAGE);

  if (currentPage > totalPages) notFound();

  const posts = await getPosts({
    status: "published",
    tagId: tag.id,
    order: "published",
    take: PUBLIC_POSTS_PER_PAGE,
    skip: (currentPage - 1) * PUBLIC_POSTS_PER_PAGE,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">标签</h1>
        <TagBadge name={tag.name} color={tag.color} className="text-sm" />
      </div>
      {tag.description && (
        <p className="mt-2 text-muted-foreground">{tag.description}</p>
      )}
      <Separator className="my-6" />

      <div className="space-y-6">
        {posts.length === 0 ? (
          <PostsEmptyState
            title="这个标签下还没有文章"
            description={`和 “${tag.name}” 相关的内容还在整理中。`}
            className="py-14"
            icon={null}
          />
        ) : (
          <>
            {posts.map((post) => (
              <PostListCard key={post.slug} post={post} />
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
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回博客
        </Link>
      </div>
    </div>
  );
}
