import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/infrastructure/database/prisma";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertSameOrigin } from "@/src/shared/http";

const inputSchema = z.object({
  orderItemId: z.string().min(1).max(100),
  previewUrl: z.string().min(1).max(2_500).refine((value) => value.startsWith("/api/uploads/") || value.startsWith("https://"), "Vista previa inválida"),
  notes: z.string().trim().max(1_000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "DESIGNER"]);
    const input = inputSchema.parse(await request.json());
    const item = await prisma.orderItem.findUnique({
      where: { id: input.orderItemId },
      include: { order: true, proofs: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!["PAID", "DESIGN_REVIEW", "WAITING_CUSTOMER_APPROVAL"].includes(item.order.status)) {
      return NextResponse.json({ error: "INVALID_STATUS", message: "Este pedido no está listo para una prueba de diseño" }, { status: 409 });
    }

    const version = (item.proofs[0]?.version ?? 0) + 1;
    const proof = await prisma.$transaction(async (tx) => {
      await tx.designProof.updateMany({ where: { orderItemId: item.id, status: "PENDING" }, data: { status: "SUPERSEDED" } });
      const created = await tx.designProof.create({ data: { orderItemId: item.id, version, previewUrl: input.previewUrl, notes: input.notes, createdById: user.id } });
      if (item.order.status === "PAID") {
        await tx.orderStatusHistory.create({ data: { orderId: item.orderId, actorId: user.id, fromStatus: "PAID", toStatus: "DESIGN_REVIEW", note: "Pedido asignado a revisión de diseño" } });
        await tx.orderStatusHistory.create({ data: { orderId: item.orderId, actorId: user.id, fromStatus: "DESIGN_REVIEW", toStatus: "WAITING_CUSTOMER_APPROVAL", note: `Prueba de diseño v${version} enviada al cliente` } });
      } else if (item.order.status === "DESIGN_REVIEW") {
        await tx.orderStatusHistory.create({ data: { orderId: item.orderId, actorId: user.id, fromStatus: "DESIGN_REVIEW", toStatus: "WAITING_CUSTOMER_APPROVAL", note: `Prueba de diseño v${version} enviada al cliente` } });
      }
      if (item.order.status !== "WAITING_CUSTOMER_APPROVAL") {
        await tx.order.update({ where: { id: item.orderId }, data: { status: "WAITING_CUSTOMER_APPROVAL" } });
      }
      await tx.auditLog.create({ data: { actorId: user.id, action: "DESIGN_PROOF_PUBLISHED", entityType: "DesignProof", entityId: created.id, after: { version, orderItemId: item.id } } });
      await tx.businessEvent.create({ data: { name: "design_proof_published", userId: item.order.userId, entityType: "DesignProof", entityId: created.id, properties: { version, orderNumber: item.order.number } } });
      return created;
    });
    return NextResponse.json({ proof: { id: proof.id, version: proof.version, status: proof.status } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
