import { db } from "@/infrastructure/db";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    await db.post.findFirst({
      select: { id: true },
    });

    return Response.json(
      {
        status: "ok",
        checks: { app: "ok", database: "ok", schema: "ok" },
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    console.error("Health check failed.", error);
    return Response.json(
      {
        status: "error",
        checks: { app: "ok", database: "error", schema: "error" },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
