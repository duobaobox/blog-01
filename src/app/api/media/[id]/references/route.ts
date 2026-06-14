import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { getMediaById, getMediaReferences } from "@/features/media/queries/media.queries";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const { id } = await context.params;
  const media = await getMediaById(id);

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const references = await getMediaReferences(media.url);
  return NextResponse.json({ references });
}
