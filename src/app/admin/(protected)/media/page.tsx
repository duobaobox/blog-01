import { getAdminMediaPageData } from "@/features/media/queries/media.queries";
import { MediaLibrary } from "@/features/media/components/media-library";

export default async function AdminMediaPage() {
  const pageData = await getAdminMediaPageData();
  return <MediaLibrary initialItems={pageData.items} />;
}
