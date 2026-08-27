import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import {
  designDecisionSchema,
  resolveDesignDecision,
} from "@/src/modules/customization/domain/design-approval";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import type { OrderStatusValue } from "@/src/modules/orders/domain/order-state-machine";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = designDecisionSchema.parse(await request.json());
    const { id } = await context.params;
    const proof = await prisma.designProof.findUnique({
      where: { id },
      include: { orderItem: { include: { order: true } } },
    });
    if (!proof || (proof.orderItem.order.userId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (proof.status !== "PENDING") {
      return NextResponse.json({ error: "ALREADY_DECIDED", message: "Esta versión ya fue respondida" }, { status: 409 });
    }

    const decision = resolveDesignDecision({
      ...input,
      version: proof.version,
      orderStatus: proof.orderItem.order.status as OrderStatusValue,
    });
    await prisma.$transaction(async (tx) => {
      await tx.designApproval.create({
        data: { proofId: proof.id, userId: user.id, approved: input.approved, comment: input.comment },
      });
      await tx.designProof.update({ where: { id: proof.id }, data: { status: decision.proofStatus } });
      if (decision.shouldTransitionOrder) {
        await tx.order.update({ where: { id: proof.orderItem.orderId }, data: { status: decision.nextOrderStatus } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: proof.orderItem.orderId,
            actorId: user.id,
            fromStatus: "WAITING_CUSTOMER_APPROVAL",
            toStatus: decision.nextOrderStatus,
            note: decision.historyNote,
          },
        });
      }
      await tx.businessEvent.create({
        data: {
          name: decision.eventName,
          userId: user.id,
          entityType: "DesignProof",
          entityId: proof.id,
          properties: { version: proof.version },
        },
      });
    });
    return NextResponse.json({ ok: true, approved: input.approved });
  } catch (error) {
    return apiError(error);
  }
}
