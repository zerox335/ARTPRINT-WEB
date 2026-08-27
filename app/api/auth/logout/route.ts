import { NextResponse, type NextRequest } from "next/server";
import { deleteCurrentSession } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await deleteCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
