import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { getMediaList } from "@/features/media/queries/media.queries";
import { toErrorResponse } from "@/shared/lib/api-error";

export const dynamic = "force-dynamic";

function disableMediaListCaching(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const mimeTypePrefix = searchParams.get("mimeTypePrefix") || undefined;
    const items = await getMediaList({ mimeTypePrefix });

    return disableMediaListCaching(NextResponse.json({ items }));
  } catch (error) {
    return disableMediaListCaching(
      toErrorResponse(error, "Failed to load media list"),
    );
  }
}
