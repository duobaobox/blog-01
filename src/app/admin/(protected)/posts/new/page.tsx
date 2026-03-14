export const dynamic = "force-dynamic";

import { getCategories, getTags } from "@/features/taxonomy";
import { PostForm } from "@/components/admin/post-form";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);

  return <PostForm categories={categories} tags={tags} />;
}
