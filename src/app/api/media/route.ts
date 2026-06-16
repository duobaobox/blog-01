import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { getMediaList } from "@/features/media/queries/media.queries";
import { toErrorResponse } from "@/shared/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const mimeTypePrefix = searchParams.get("mimeTypePrefix") || undefined;
    const items = await getMediaList({ mimeTypePrefix });

    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error, "Failed to load media list");
  }
}
