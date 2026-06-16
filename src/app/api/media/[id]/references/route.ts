import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { getMediaById, getMediaReferences } from "@/features/media/queries/media.queries";
import { NotFoundError } from "@/shared/lib/app-error";
import { toErrorResponse } from "@/shared/lib/api-error";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const media = await getMediaById(id);

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    const references = await getMediaReferences(media.id);
    return NextResponse.json({ references });
  } catch (error) {
    return toErrorResponse(error, "Failed to load media references");
  }
}
