import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import { uploadFile } from "@/features/media/services/media.service";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let result;
  try {
    result = await uploadFile(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.url, media: result.media });
}
