import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/infrastructure/auth";
import {
  parseAiGenerateInput,
} from "@/features/ai/lib/ai-schema";
import { generateSeoMetadata } from "@/features/ai/services/ai.service";
import { toErrorResponse } from "@/shared/lib/api-error";
import { ConfigurationError } from "@/shared/lib/app-error";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();

    const body = await request.json().catch(() => null);
    const input = parseAiGenerateInput(body);
    const result = await generateSeoMetadata(input);

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return toErrorResponse(error, "AI 请求失败");
  }
}
