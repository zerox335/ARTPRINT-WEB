import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/infrastructure/database/prisma";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { assertOrderTransition, canManageOrderStatus, orderStatuses } from "@/src/modules/orders/domain/order-state-machine";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "DESIGNER", "PRODUCTION", "CUSTOMER_SUPPORT"]);
    if (!canManageOrderStatus(user.role)) throw new Error("FORBIDDEN");
    const input = z.object({ status: z.enum(orderStatuses), note: z.string().trim().min(3).max(500) }).parse(await request.json());
    if (input.status === "PAID") throw new Error("FORBIDDEN");
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    assertOrderTransition(order.status, input.status);
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: input.status } });
      await tx.orderStatusHistory.create({ data: { orderId: id, actorId: user.id, fromStatus: order.status, toStatus: input.status, note: input.note } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "ORDER_STATUS_CHANGED", entityType: "Order", entityId: id, before: { status: order.status }, after: { status: input.status }, metadata: { note: input.note } } });
    });
    return NextResponse.json({ ok: true, status: input.status });
  } catch (error) { return apiError(error); }
}
