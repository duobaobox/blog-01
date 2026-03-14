export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPostById } from "@/features/posts/queries/post.queries";
import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import { PostForm } from "@/components/admin/post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    getPostById(id),
    getCategories(),
    getTags(),
  ]);

  if (!post) notFound();

  return (
    <PostForm
      post={{
        ...post,
        tags: post.tags as {
          tag: { id: string; name: string; color: string | null };
        }[],
      }}
      categories={categories}
      tags={tags}
    />
  );
}
