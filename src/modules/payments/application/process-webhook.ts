import { Prisma } from "@prisma/client";
import { prisma } from "@/src/infrastructure/database/prisma";
import { paymentProvider } from "@/src/modules/payments/infrastructure/providers";
import type { PaymentProviderName, WebhookInput } from "@/src/modules/payments/domain/payment-provider";

export async function processPaymentWebhook(providerName: PaymentProviderName, input: WebhookInput) {
  const provider = paymentProvider(providerName);
  const event = await provider.verifyWebhook(input);
  if (!event.valid) return { accepted: false, reason: "INVALID_SIGNATURE" } as const;

  const payment = await prisma.payment.findFirst({
    where: {
      provider: providerName,
      OR: [
        ...(event.providerPaymentId ? [{ providerPaymentId: event.providerPaymentId }] : []),
        ...(event.reference ? [{ providerReference: event.reference }] : []),
      ],
    },
    include: { order: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentEvent.create({
        data: {
          paymentId: payment?.id,
          provider: providerName,
          providerEventId: event.eventId,
          eventType: event.eventType,
          signatureValid: true,
          payload: event.raw as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
      if (!payment || !event.status) return;
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: event.status, providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId, approvedAt: event.status === "APPROVED" ? new Date() : undefined },
      });
      if (event.status === "APPROVED" && payment.order.status === "PENDING_PAYMENT") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
        await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, fromStatus: "PENDING_PAYMENT", toStatus: "PAID", note: `Pago confirmado por ${providerName}` } });
        await tx.businessEvent.create({ data: { name: "payment_approved", userId: payment.order.userId, entityType: "Order", entityId: payment.orderId, properties: { provider: providerName, amount: payment.amount } } });
      } else if (["DECLINED", "ERROR"].includes(event.status)) {
        await tx.businessEvent.create({ data: { name: "payment_failed", userId: payment.order.userId, entityType: "Order", entityId: payment.orderId, properties: { provider: providerName, status: event.status } } });
      }
    });
    return { accepted: true, duplicate: false, paymentFound: Boolean(payment) } as const;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { accepted: true, duplicate: true, paymentFound: Boolean(payment) } as const;
    }
    throw error;
  }
}
