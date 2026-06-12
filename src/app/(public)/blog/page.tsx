import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/shared/ui/separator";
import { PostsEmptyState } from "@/features/posts/components/posts-empty-state";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { PostsPagination } from "@/components/blog/posts-pagination";
import {
  getPostCount,
  getPosts,
} from "@/features/posts/queries/post.queries";
import {
  getTotalPages,
  parsePageParam,
  PUBLIC_POSTS_PER_PAGE,
} from "@/features/posts/lib/pagination";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import { TagBadge } from "@/features/taxonomy/components/tag-badge";
import { CategoryBadge } from "@/features/taxonomy/components/category-badge";
import { generateSeo } from "@/infrastructure/seo";

export const revalidate = 300;

export async function generateMetadata() {
  return generateSeo({
    title: "博客",
    description: "技术文章、项目经验和学习笔记。",
    url: "/blog",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const currentPage = parsePageParam(params.page);

  if (!currentPage) {
    notFound();
  }

  const [totalPosts, categories, tags] = await Promise.all([
    getPostCount({ status: "published" }),
    getCategories("public"),
    getTags("public"),
  ]);
  const totalPages = getTotalPages(totalPosts, PUBLIC_POSTS_PER_PAGE);

  if (currentPage > totalPages) {
    notFound();
  }

  const posts = await getPosts({
    status: "published",
    order: "published",
    take: PUBLIC_POSTS_PER_PAGE,
    skip: (currentPage - 1) * PUBLIC_POSTS_PER_PAGE,
  });
  const hasSidebarContent = categories.length > 0 || tags.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">博客</h1>
      <p className="mt-2 text-muted-foreground">
        技术文章、项目经验和学习笔记。
      </p>
      <Separator className="my-6" />

      {posts.length === 0 && !hasSidebarContent ? (
        <PostsEmptyState
          title="还没有公开文章"
          description="第一篇文章发布后，这里会展示完整的博客列表。"
          className="py-16"
          size="lg"
          icon={null}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* 文章列表 */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <PostsEmptyState
                title="还没有公开文章"
                description="文章列表正在准备中，你可以先浏览分类或标签。"
                className="py-14"
                icon={null}
              />
            ) : (
              <>
                {posts.map((post) => (
                  <PostListCard key={post.slug} post={post} />
                ))}
                <PostsPagination
                  pathname="/blog"
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalPosts}
                />
              </>
            )}
          </div>

          {/* 侧边栏 */}
          <aside className="space-y-8">
            {/* 分类部分 */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <span>分类</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {categories.length}
                </span>
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/blog/categories/${cat.slug}`}
                    className="block transition-all duration-200 hover:-translate-x-1"
                  >
                    <CategoryBadge
                      name={cat.name}
                      showCount={cat._count.posts}
                      className="w-full flex"
                    />
                  </Link>
                ))}
                {categories.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    暂无分类
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            {/* 标签部分 */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <span>标签</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {tags.length}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tags/${tag.slug}`}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <TagBadge
                      name={tag.name}
                      color={tag.color}
                      className="cursor-pointer transition-colors"
                    />
                  </Link>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-muted-foreground">暂无标签</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
