export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/shared/ui/separator";
import { PostListCard } from "@/features/posts/components/post-list-card";
import { getPosts } from "@/features/posts/queries/post.queries";
import { getTagBySlug } from "@/features/taxonomy/queries/tag.queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "标签未找到" };
  return { title: `标签: ${tag.name}` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) notFound();

  const posts = await getPosts({ status: "published", tagId: tag.id });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">标签: {tag.name}</h1>
      {tag.description && (
        <p className="mt-2 text-muted-foreground">{tag.description}</p>
      )}
      <Separator className="my-6" />

      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            该标签下暂无文章
          </p>
        ) : (
          posts.map((post) => <PostListCard key={post.slug} post={post} />)
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
