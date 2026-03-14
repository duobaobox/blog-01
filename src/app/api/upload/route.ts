import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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

  const ext = ALLOWED_TYPES[file.type];

  if (!ext) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 400 },
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  const url = `/uploads/${filename}`;

  return NextResponse.json({ url });
}
