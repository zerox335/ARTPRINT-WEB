import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/src/infrastructure/database/prisma";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";
import { shippingTotalForMerchandise } from "@/src/modules/checkout/domain/checkout";
import { customizationSpecSchema, type CustomizationSpec } from "@/src/modules/customization/domain/customization";
import { paymentProvider } from "@/src/modules/payments/infrastructure/providers";
import { quoteProduct } from "@/src/modules/pricing/application/quote-product";
import { quoteRequestSchema } from "@/src/modules/pricing/domain/price-engine";
import { env } from "@/src/shared/env";
import type { AuthenticatedUser } from "@/src/modules/identity/infrastructure/session";

export const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({
    ...quoteRequestSchema.shape,
    customization: customizationSpecSchema.optional(),
  })).min(1).max(25),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(200),
    phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/),
  }),
  shipping: z.object({
    recipient: z.string().trim().min(2).max(100),
    line1: z.string().trim().min(5).max(160),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().min(2).max(100),
    department: z.string().trim().min(2).max(100),
    notes: z.string().trim().max(500).optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

async function canonicalCustomization(spec: CustomizationSpec | undefined, userId: string): Promise<CustomizationSpec | undefined> {
  if (!spec) return undefined;
  const imageElements = spec.elements.filter((element) => element.type === "IMAGE");
  const assetIds = [...new Set(imageElements.map((element) => element.assetId))];
  const assets = assetIds.length
    ? await prisma.uploadedAsset.findMany({ where: { id: { in: assetIds }, status: "READY", OR: [{ userId }, { userId: null }] } })
    : [];
  if (assets.length !== assetIds.length) throw new Error("Uno o más archivos de personalización no están disponibles");
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return {
    ...spec,
    elements: spec.elements.map((element) =>
      element.type === "IMAGE"
        ? { ...element, originalStorageKey: byId.get(element.assetId)?.storageKey ?? "" }
        : element,
    ),
  };
}

function orderNumber(): string {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `AP-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createOrder(raw: CreateOrderInput, user: AuthenticatedUser) {
  const input = createOrderSchema.parse(raw);
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { payments: true } });
  if (existing) return { order: existing, checkoutUrl: existing.payments[0]?.checkoutUrl ?? null, reused: true };

  const pricedItems = await Promise.all(
    input.items.map(async (item) => {
      const [quote, product, customization] = await Promise.all([
        quoteProduct(item),
        catalogRepository.findByVariantId(item.variantId),
        canonicalCustomization(item.customization, user.id),
      ]);
      if (!product) throw new Error("Product not found");
      const variant = product.variants.find((candidate) => candidate.id === item.variantId);
      if (!variant) throw new Error("Variant not found");
      if (customization && customization.productId !== product.id) throw new Error("Customization product mismatch");
      return { item, quote, product, variant, customization };
    }),
  );

  const subtotal = pricedItems.reduce((sum, item) => sum + item.quote.subtotal, 0);
  const discountTotal = pricedItems.reduce((sum, item) => sum + item.quote.discountTotal, 0);
  const merchandiseTotal = subtotal - discountTotal;
  const shippingTotal = shippingTotalForMerchandise(merchandiseTotal);
  const grandTotal = merchandiseTotal + shippingTotal;
  const number = orderNumber();
  const provider = paymentProvider();
  const reference = `${number}-${randomBytes(4).toString("hex")}`;

  const { order, payment } = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        number,
        userId: user.id,
        status: "PENDING_PAYMENT",
        subtotal,
        discountTotal,
        taxTotal: 0,
        shippingTotal,
        grandTotal,
        customerSnapshot: input.customer,
        shippingSnapshot: input.shipping,
        notes: input.shipping.notes,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: pricedItems.map(({ item, quote, product, variant, customization }) => ({
            productId: product.id,
            variantId: variant.id,
            skuSnapshot: variant.sku,
            productSnapshot: { id: product.id, name: product.name, slug: product.slug, imageUrl: product.imageUrl, basePrice: product.basePrice },
            variantSnapshot: variant,
            customizationSnapshot: customization ?? undefined,
            quantity: item.quantity,
            unitPrice: quote.unitPrice,
            lineTotal: quote.total,
          })),
        },
        statusHistory: {
          create: { actorId: user.id, fromStatus: "PENDING_PAYMENT", toStatus: "PENDING_PAYMENT", note: "Pedido creado" },
        },
      },
      include: { items: true },
    });
    const createdPayment = await tx.payment.create({
      data: { orderId: createdOrder.id, provider: provider.name, providerReference: reference, status: "CREATED", amount: grandTotal },
    });
    await tx.businessEvent.create({ data: { name: "checkout_started", userId: user.id, entityType: "Order", entityId: createdOrder.id, properties: { total: grandTotal, itemCount: pricedItems.length } } });
    return { order: createdOrder, payment: createdPayment };
  });

  try {
    const checkout = await provider.createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      reference,
      amountCop: order.grandTotal,
      customerEmail: input.customer.email,
      description: `Pedido ArtPrint ${order.number}`,
      returnUrl: `${env.NEXT_PUBLIC_APP_URL}/checkout/resultado?order=${encodeURIComponent(order.number)}`,
      webhookUrl: `${env.NEXT_PUBLIC_APP_URL}/api/payments/webhooks/${provider.name}`,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING", checkoutUrl: checkout.checkoutUrl, providerPaymentId: checkout.providerPaymentId, rawResponse: checkout.raw as Prisma.InputJsonValue },
    });
    return { order, checkoutUrl: checkout.checkoutUrl, reused: false };
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "ERROR", rawResponse: { message: error instanceof Error ? error.message : "Provider error" } } });
    throw error;
  }
}
