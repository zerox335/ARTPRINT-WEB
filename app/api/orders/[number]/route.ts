import { NextResponse } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError } from "@/src/shared/http";

export async function GET(_: Request, context: { params: Promise<{ number: string }> }) {
  try {
    const user = await requireUser();
    const { number } = await context.params;
    const order = await prisma.order.findUnique({ where: { number }, include: { items: { include: { proofs: { orderBy: { version: "desc" }, include: { approvals: { orderBy: { createdAt: "desc" }, take: 1 } } } } }, payments: { orderBy: { createdAt: "desc" }, take: 1 }, statusHistory: { orderBy: { createdAt: "asc" } } } });
    if (!order || (order.userId !== user.id && user.role !== "ADMIN")) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ order: { id: order.id, number: order.number, status: order.status, total: order.grandTotal, createdAt: order.createdAt, items: order.items.map((item) => ({ id: item.id, product: item.productSnapshot, variant: item.variantSnapshot, quantity: item.quantity, lineTotal: item.lineTotal, proofs: item.proofs.map((proof) => ({ id: proof.id, version: proof.version, previewUrl: proof.previewUrl, notes: proof.notes, status: proof.status, createdAt: proof.createdAt, decision: proof.approvals[0] ? { approved: proof.approvals[0].approved, comment: proof.approvals[0].comment, createdAt: proof.approvals[0].createdAt } : null })) })), paymentStatus: order.payments[0]?.status ?? "CREATED", history: order.statusHistory } });
  } catch (error) { return apiError(error); }
}
