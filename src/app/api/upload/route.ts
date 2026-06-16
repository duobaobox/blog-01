import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { mediaActionRunner } from "@/features/media/actions/media-action-runtime";
import { parseMediaFileFormData } from "@/features/media/lib/media-write";
import { toErrorResponse } from "@/shared/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const formData = await request.formData();
    const media = await mediaActionRunner.uploadMedia(
      parseMediaFileFormData(formData),
    );

    return NextResponse.json({ url: media.url, media });
  } catch (error) {
    return toErrorResponse(error, "Upload failed");
  }
}
