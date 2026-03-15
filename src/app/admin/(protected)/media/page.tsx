export const dynamic = "force-dynamic";

import { getMediaList } from "@/features/media/queries/media.queries";
import { MediaLibrary } from "@/features/media/components/media-library";

export default async function AdminMediaPage() {
  const items = await getMediaList();
  return <MediaLibrary initialItems={items} />;
}
