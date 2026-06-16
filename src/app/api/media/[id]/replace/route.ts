import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { mediaActionRunner } from "@/features/media/actions/media-action-runtime";
import { parseMediaFileFormData } from "@/features/media/lib/media-write";
import { toErrorResponse } from "@/shared/lib/api-error";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const formData = await request.formData();
    const media = await mediaActionRunner.replaceMedia(
      id,
      parseMediaFileFormData(formData),
    );

    return NextResponse.json({ url: media.url, media });
  } catch (error) {
    return toErrorResponse(error, "Replace failed");
  }
}
