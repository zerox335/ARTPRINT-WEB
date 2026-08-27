import { NextResponse, type NextRequest } from "next/server";
import { createOrder } from "@/src/modules/orders/application/create-order";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertRateLimit, assertSameOrigin, clientKey } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertRateLimit(`order:${clientKey(request)}`, 15, 60 * 60 * 1000);
    const user = await requireUser();
    const result = await createOrder(await request.json(), user);
    return NextResponse.json({ order: { id: result.order.id, number: result.order.number, total: result.order.grandTotal }, checkoutUrl: result.checkoutUrl, reused: result.reused }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
