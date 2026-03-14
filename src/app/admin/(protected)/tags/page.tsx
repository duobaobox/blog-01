export const dynamic = "force-dynamic";

import { getTags } from "@/features/taxonomy";
import { TagsList } from "@/components/admin/tags-list";

export default async function AdminTagsPage() {
  const tags = await getTags();
  return <TagsList tags={tags} />;
}
