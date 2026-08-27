import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { demoCategories, demoProducts } from "@/src/modules/catalog/infrastructure/demo-catalog";

const prisma = new PrismaClient();

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function main() {
  const [adminPassword, customerPassword] = await Promise.all([hash("AdminArtPrint2026!", 12), hash("ClienteArtPrint2026!", 12)]);
  const admin = await prisma.user.upsert({ where: { email: "admin@artprint.local" }, update: { name: "Administración ArtPrint", passwordHash: adminPassword, role: "ADMIN", active: true }, create: { id: "user-admin-demo", email: "admin@artprint.local", name: "Administración ArtPrint", passwordHash: adminPassword, role: "ADMIN" } });
  const customer = await prisma.user.upsert({ where: { email: "cliente@artprint.local" }, update: { name: "Cliente Demo", passwordHash: customerPassword, role: "CUSTOMER", active: true }, create: { id: "user-customer-demo", email: "cliente@artprint.local", name: "Cliente Demo", phone: "3001234567", passwordHash: customerPassword, role: "CUSTOMER" } });

  const activationLogs = await prisma.auditLog.findMany({ where: { action: "CASE_REFERENCE_ACTIVATED" }, orderBy: { createdAt: "desc" }, select: { entityId: true, after: true } });
  const activationByProduct = new Map<string, Record<string, unknown>>();
  for (const log of activationLogs) if (!activationByProduct.has(log.entityId)) activationByProduct.set(log.entityId, jsonRecord(log.after));
  const activatedMockupIds = [...activationByProduct.values()].flatMap((entry) => typeof entry.mockupId === "string" ? [entry.mockupId] : []);
  const [activatedMockups, previouslyPersistedProducts] = await Promise.all([
    prisma.mockup.findMany({ where: { id: { in: activatedMockupIds } }, include: { printAreas: true } }),
    prisma.product.findMany({ where: { id: { in: [...activationByProduct.keys()] } }, select: { id: true, metadata: true } }),
  ]);
  const activatedMockupById = new Map(activatedMockups.map((mockup) => [mockup.id, mockup]));
  const previousMetadataByProduct = new Map(previouslyPersistedProducts.map((product) => [product.id, jsonRecord(product.metadata)]));

  for (const [position, category] of demoCategories.entries()) {
    await prisma.category.upsert({ where: { id: category.id }, update: { name: category.name, slug: category.slug, description: category.description, imageUrl: category.imageUrl, position, active: true }, create: { id: category.id, name: category.name, slug: category.slug, description: category.description, imageUrl: category.imageUrl, position, active: true } });
  }

  for (const product of demoProducts) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: product.categorySlug } });
    const printExclusions = Object.fromEntries(product.printAreas.filter((area) => area.exclusions?.length).map((area) => [area.id, area.exclusions]));
    const activation = activationByProduct.get(product.id);
    const activatedMockup = activation && typeof activation.mockupId === "string" ? activatedMockupById.get(activation.mockupId) : undefined;
    const activatedArea = activatedMockup && typeof activation?.areaId === "string" ? activatedMockup.printAreas.find((area) => area.id === activation.areaId) : undefined;
    const previousMetadata = previousMetadataByProduct.get(product.id) ?? {};
    const previousExclusions = previousMetadata.mockupStatus === "CALIBRATED" && previousMetadata.printExclusions && typeof previousMetadata.printExclusions === "object" ? previousMetadata.printExclusions : undefined;
    const preservedExclusions = activatedArea ? previousExclusions ?? { [activatedArea.id]: [{ id: `recovered-camera-${activatedArea.id}`, name: "Cámara", x: 20, y: 8, width: 25, height: 22, radius: 8 }] } : undefined;
    const metadata = {
      ...(product.badge ? { badge: product.badge } : {}),
      ...(product.brand ? { brand: product.brand } : {}),
      ...(product.series ? { series: product.series } : {}),
      ...(product.deviceModel ? { deviceModel: product.deviceModel } : {}),
      ...(activatedArea ? { mockupStatus: "CALIBRATED" } : product.mockupStatus ? { mockupStatus: product.mockupStatus } : {}),
      ...(preservedExclusions ? { printExclusions: preservedExclusions } : Object.keys(printExclusions).length ? { printExclusions } : {}),
      leadTime: product.leadTime,
      techniques: product.techniques,
      highlights: product.highlights,
      activePrintAreaIds: activatedArea ? [activatedArea.id] : product.printAreas.map((area) => area.id),
    };
    const productStatus = activatedArea ? "ACTIVE" : product.mockupStatus === "REFERENCE_ONLY" ? "DRAFT" : "ACTIVE";
    await prisma.product.upsert({
      where: { id: product.id },
      update: { categoryId: category.id, name: product.name, slug: product.slug, shortDescription: product.shortDescription, description: product.description, basePrice: product.basePrice, status: productStatus, featured: product.featured, customizable: product.customizable, metadata },
      create: { id: product.id, categoryId: category.id, name: product.name, slug: product.slug, shortDescription: product.shortDescription, description: product.description, basePrice: product.basePrice, costPrice: Math.round(product.basePrice * .55), status: productStatus, featured: product.featured, customizable: product.customizable, metadata },
    });
    const activeSkus = product.variants.map((variant) => variant.sku);
    await prisma.productVariant.updateMany({
      where: { productId: product.id, ...(activeSkus.length ? { sku: { notIn: activeSkus } } : {}) },
      data: { active: false },
    });
    const galleryToPersist = activatedMockup ? [activatedMockup.imageUrl, ...product.gallery.slice(1)] : product.gallery;
    for (const [position, imageUrl] of galleryToPersist.entries()) {
      const id = `image-${product.id}-${position}`;
      await prisma.productImage.upsert({ where: { id }, update: { url: imageUrl, alt: `${product.name}, vista ${position + 1}`, position }, create: { id, productId: product.id, url: imageUrl, alt: `${product.name}, vista ${position + 1}`, position } });
    }
    for (const variant of product.variants) {
      const persistedVariant = await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { productId: product.id, name: variant.name, color: variant.color, colorHex: variant.colorHex, size: variant.size, material: variant.material, technique: variant.technique, priceModifier: variant.priceModifier, active: variant.available },
        create: { id: variant.id, productId: product.id, sku: variant.sku, name: variant.name, color: variant.color, colorHex: variant.colorHex, size: variant.size, material: variant.material, technique: variant.technique, priceModifier: variant.priceModifier, active: variant.available },
      });
      await prisma.inventory.upsert({ where: { variantId: persistedVariant.id }, update: { tracked: false }, create: { variantId: persistedVariant.id, tracked: false, quantity: 0 } });
    }
    const grouped = Map.groupBy(product.printAreas, (area) => area.view);
    let mockupPosition = 0;
    for (const [view, areas] of grouped) {
      const mockupId = `mockup-${product.id}-${view.toLocaleLowerCase("en")}`;
      const imageUrl = areas[0]?.mockupImageUrl ?? (view === "BACK" && product.gallery[1] ? product.gallery[1] : product.imageUrl);
      await prisma.mockup.upsert({ where: { id: mockupId }, update: { name: view, view, imageUrl, widthPx: 1024, heightPx: 1024, position: mockupPosition }, create: { id: mockupId, productId: product.id, name: view, view, imageUrl, widthPx: 1024, heightPx: 1024, position: mockupPosition } });
      for (const area of areas) {
        await prisma.printArea.upsert({ where: { id: area.id }, update: { mockupId, name: area.name, x: area.x, y: area.y, width: area.width, height: area.height, realWidthCm: area.realWidthCm, realHeightCm: area.realHeightCm, allowOverflow: area.allowOverflow ?? false }, create: { id: area.id, mockupId, name: area.name, x: area.x, y: area.y, width: area.width, height: area.height, realWidthCm: area.realWidthCm, realHeightCm: area.realHeightCm, allowOverflow: area.allowOverflow ?? false } });
      }
      mockupPosition += 1;
    }
    const volumeRuleId = `price-volume-${product.id}`;
    await prisma.priceRule.upsert({ where: { id: volumeRuleId }, update: { active: true, conditions: { tiers: [{ minimum: 12, percent: 5 }, { minimum: 25, percent: 10 }, { minimum: 50, percent: 15 }] } }, create: { id: volumeRuleId, productId: product.id, name: "Descuentos por volumen", type: "VOLUME", priority: 100, conditions: { tiers: [{ minimum: 12, percent: 5 }, { minimum: 25, percent: 10 }, { minimum: 50, percent: 15 }] }, adjustment: 0 } });
  }

  const demoProduct = demoProducts[0]!;
  const demoVariant = demoProduct.variants[1]!;
  const demoOrder = await prisma.order.upsert({
    where: { number: "AP-DEMO-0001" },
    update: {},
    create: { id: "order-demo-1", number: "AP-DEMO-0001", userId: customer.id, status: "DESIGN_REVIEW", subtotal: 42000, discountTotal: 0, taxTotal: 0, shippingTotal: 9000, grandTotal: 51000, customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone }, shippingSnapshot: { recipient: customer.name, line1: "Carrera 7 # 72-41", city: "Bogotá", department: "Cundinamarca" }, items: { create: { id: "order-item-demo-1", productId: demoProduct.id, variantId: demoVariant.id, skuSnapshot: demoVariant.sku, productSnapshot: { id: demoProduct.id, name: demoProduct.name, slug: demoProduct.slug, imageUrl: demoProduct.imageUrl }, variantSnapshot: demoVariant, customizationSnapshot: { version: 1, elements: [{ type: "TEXT", content: "SANTIAGO 18", printAreaId: "area-tee-front" }] }, quantity: 1, unitPrice: 42000, lineTotal: 42000 } }, statusHistory: { createMany: { data: [{ actorId: customer.id, fromStatus: "PENDING_PAYMENT", toStatus: "PENDING_PAYMENT", note: "Pedido demo creado" }, { actorId: admin.id, fromStatus: "PENDING_PAYMENT", toStatus: "PAID", note: "Pago sandbox confirmado" }, { actorId: admin.id, fromStatus: "PAID", toStatus: "DESIGN_REVIEW", note: "Diseño asignado" }] } } },
  });
  await prisma.payment.upsert({ where: { providerReference: "sandbox-demo-payment" }, update: {}, create: { orderId: demoOrder.id, provider: "sandbox", providerPaymentId: "sandbox-demo-1", providerReference: "sandbox-demo-payment", status: "APPROVED", amount: 51000, approvedAt: new Date() } });

  console.info("Seed completed");
  console.info("Admin: admin@artprint.local / AdminArtPrint2026!");
  console.info("Customer: cliente@artprint.local / ClienteArtPrint2026!");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
