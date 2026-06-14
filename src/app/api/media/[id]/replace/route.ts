import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import { replaceFile } from "@/features/media/services/media.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await replaceFile(id, file);

  if (result.error || !result.media) {
    return NextResponse.json(
      { error: result.error || "Replace failed" },
      { status: 400 },
    );
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/posts");

  return NextResponse.json({ url: result.url, media: result.media });
}
