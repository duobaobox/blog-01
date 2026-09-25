import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "media");

const MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

export const dynamic = "force-dynamic";

function isSafeFilename(filename: string) {
  return (
    filename === path.basename(filename) &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!isSafeFilename(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const mimeType = MIME_TYPES[path.extname(filename).toLowerCase()];
  if (!mimeType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(path.join(UPLOAD_DIR, filename));
    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
