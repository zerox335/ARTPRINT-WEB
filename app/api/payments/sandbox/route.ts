import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/infrastructure/database/prisma";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { env } from "@/src/shared/env";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function GET(request: NextRequest) {
  try {
    if (env.NODE_ENV === "production") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const user = await requireUser();
    const reference = new URL(request.url).searchParams.get("reference");
    if (!reference) return NextResponse.json({ error: "REFERENCE_REQUIRED" }, { status: 400 });
    const payment = await prisma.payment.findUnique({ where: { providerReference: reference }, include: { order: true } });
    if (!payment || (payment.order.userId !== user.id && user.role !== "ADMIN")) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ payment: { reference, amount: payment.amount, status: payment.status, orderNumber: payment.order.number } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (env.NODE_ENV === "production") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const user = await requireUser();
    const input = z.object({ reference: z.string().min(1).max(150), status: z.enum(["APPROVED", "DECLINED"]) }).parse(await request.json());
    const payment = await prisma.payment.findUnique({ where: { providerReference: input.reference }, include: { order: true } });
    if (!payment || (payment.order.userId !== user.id && user.role !== "ADMIN")) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (payment.status === input.status) return NextResponse.json({ orderNumber: payment.order.number, status: payment.status });
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: input.status, approvedAt: input.status === "APPROVED" ? new Date() : undefined } });
      await tx.paymentEvent.create({ data: { paymentId: payment.id, provider: "sandbox", providerEventId: `sandbox:${payment.id}:${input.status}`, eventType: "sandbox.payment.updated", signatureValid: true, payload: { reference: input.reference, status: input.status, explicitDevelopmentSandbox: true } satisfies Prisma.InputJsonValue, processedAt: new Date() } });
      if (input.status === "APPROVED" && payment.order.status === "PENDING_PAYMENT") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
        await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, actorId: user.id, fromStatus: "PENDING_PAYMENT", toStatus: "PAID", note: "Pago aprobado en sandbox explícito de desarrollo" } });
        await tx.businessEvent.create({ data: { name: "payment_approved", userId: payment.order.userId, entityType: "Order", entityId: payment.orderId, properties: { provider: "sandbox", development: true } } });
      }
    });
    return NextResponse.json({ orderNumber: payment.order.number, status: input.status });
  } catch (error) { return apiError(error); }
}
