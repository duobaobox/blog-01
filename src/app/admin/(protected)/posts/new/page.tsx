export const dynamic = "force-dynamic";

import { getCategories } from "@/features/taxonomy/queries/category.queries";
import { getTags } from "@/features/taxonomy/queries/tag.queries";
import { PostForm } from "@/components/admin/post-form";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);

  return <PostForm categories={categories} tags={tags} />;
}
