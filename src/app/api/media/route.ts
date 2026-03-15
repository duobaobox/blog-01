import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { getMediaList } from "@/features/media/queries/media.queries";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mimeTypePrefix = searchParams.get("mimeTypePrefix") || undefined;

  const items = await getMediaList({ mimeTypePrefix });
  return NextResponse.json({ items });
}
