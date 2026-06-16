import { getAdminTagsPageData } from "@/features/taxonomy/queries/tag.queries";
import { TagsList } from "@/components/admin/tags-list";

export default async function AdminTagsPage() {
  const pageData = await getAdminTagsPageData();
  return <TagsList tags={pageData.tags} />;
}
