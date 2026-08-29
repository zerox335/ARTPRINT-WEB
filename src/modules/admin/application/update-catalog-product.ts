import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/infrastructure/database/prisma";
import type { CatalogProductUpdate } from "@/src/modules/admin/domain/catalog-product-update";

export class CatalogProductUpdateError extends Error {
  constructor(public readonly code: "PRODUCT_NOT_FOUND" | "CATEGORY_NOT_FOUND" | "ASSET_NOT_FOUND" | "CATALOG_CONFLICT" | "INVALID_REFERENCE") {
    super(code);
  }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function updateCatalogProduct(productId: string, input: CatalogProductUpdate, actorId: string) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { select: { id: true } }, mockups: { include: { printAreas: { select: { id: true } } } } },
  });
  if (!existing) throw new CatalogProductUpdateError("PRODUCT_NOT_FOUND");

  const assetIds = [...new Set([
    ...input.gallery.flatMap((image) => image.assetId ? [image.assetId] : []),
    ...input.mockups.flatMap((mockup) => mockup.assetId ? [mockup.assetId] : []),
  ])];
  const skus = input.variants.map((variant) => variant.sku);
  const [category, assets, conflict] = await Promise.all([
    prisma.category.findFirst({ where: { id: input.categoryId, active: true }, select: { id: true } }),
    assetIds.length ? prisma.uploadedAsset.findMany({ where: { id: { in: assetIds }, userId: actorId, status: "READY" }, select: { id: true, widthPx: true, heightPx: true } }) : Promise.resolve([]),
    prisma.product.findFirst({ where: { id: { not: productId }, OR: [{ slug: input.slug }, { variants: { some: { sku: { in: skus } } } }] }, select: { id: true } }),
  ]);
  if (!category) throw new CatalogProductUpdateError("CATEGORY_NOT_FOUND");
  if (assets.length !== assetIds.length) throw new CatalogProductUpdateError("ASSET_NOT_FOUND");
  if (conflict || new Set(skus).size !== skus.length) throw new CatalogProductUpdateError("CATALOG_CONFLICT");

  const existingVariantIds = new Set(existing.variants.map((variant) => variant.id));
  const existingMockups = new Map(existing.mockups.map((mockup) => [mockup.id, new Set(mockup.printAreas.map((area) => area.id))]));
  for (const variant of input.variants) if (variant.id && !existingVariantIds.has(variant.id)) throw new CatalogProductUpdateError("INVALID_REFERENCE");
  for (const mockup of input.mockups) {
    if (mockup.id && !existingMockups.has(mockup.id)) throw new CatalogProductUpdateError("INVALID_REFERENCE");
    const knownAreas = mockup.id ? existingMockups.get(mockup.id) : undefined;
    for (const area of mockup.printAreas) if (area.id && !knownAreas?.has(area.id)) throw new CatalogProductUpdateError("INVALID_REFERENCE");
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const sourceUrl = (source: { assetId?: string; url?: string }) => source.assetId ? `/api/uploads/${source.assetId}` : source.url!;
  const preparedMockups = input.mockups.map((mockup, position) => {
    const asset = mockup.assetId ? assetsById.get(mockup.assetId) : undefined;
    return {
      ...mockup,
      id: mockup.id ?? `mockup-${randomUUID()}`,
      imageUrl: sourceUrl(mockup),
      widthPx: asset?.widthPx ?? mockup.widthPx,
      heightPx: asset?.heightPx ?? mockup.heightPx,
      position,
      printAreas: mockup.printAreas.map((area) => ({ ...area, id: area.id ?? `area-${randomUUID()}` })),
    };
  });
  const activePrintAreaIds = preparedMockups.flatMap((mockup) => mockup.printAreas.map((area) => area.id));
  const printAreaShapes = Object.fromEntries(preparedMockups.flatMap((mockup) => mockup.printAreas.map((area) => [area.id, area.shape])));
  const printExclusions = Object.fromEntries(preparedMockups.flatMap((mockup) => mockup.printAreas.filter((area) => area.exclusions.length).map((area) => [area.id, area.exclusions.map((exclusion) => ({ id: exclusion.id ?? `exclusion-${randomUUID()}`, ...exclusion }))])));
  const previousMetadata = metadataRecord(existing.metadata);
  const metadata = {
    ...previousMetadata,
    adminManaged: true,
    productType: input.productType,
    leadTime: input.leadTime,
    techniques: [...new Set(input.techniques)],
    highlights: [...new Set(input.highlights)],
    ...(input.brand ? { brand: input.brand } : { brand: null }),
    ...(input.series ? { series: input.series } : { series: null }),
    ...(input.deviceModel ? { deviceModel: input.deviceModel } : { deviceModel: null }),
    ...(input.badge ? { badge: input.badge } : { badge: null }),
    readyMade: input.readyMade,
    ...(input.designTheme ? { designTheme: input.designTheme } : { designTheme: null }),
    designTags: [...new Set(input.designTags)],
    mockupStatus: input.customizable && preparedMockups.length ? "CALIBRATED" : "REFERENCE_ONLY",
    activePrintAreaIds,
    printAreaShapes,
    printExclusions,
  } satisfies Record<string, unknown>;

  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.update({
      where: { id: productId },
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        basePrice: input.basePrice,
        costPrice: input.costPrice,
        status: input.status,
        featured: input.featured,
        customizable: input.customizable,
        metadata: metadata as Prisma.InputJsonValue,
      },
      select: { id: true, name: true, slug: true, status: true },
    });

    await transaction.productImage.deleteMany({ where: { productId } });
    await transaction.productImage.createMany({ data: input.gallery.map((image, position) => ({ productId, url: sourceUrl(image), alt: `${input.name}, imagen ${position + 1}`, position })) });

    const includedExistingVariantIds = input.variants.flatMap((variant) => variant.id ? [variant.id] : []);
    await transaction.productVariant.updateMany({ where: { productId, ...(includedExistingVariantIds.length ? { id: { notIn: includedExistingVariantIds } } : {}) }, data: { active: false } });
    for (const variant of input.variants) {
      const data = { productId, sku: variant.sku, name: variant.name, color: variant.color, colorHex: variant.colorHex, size: variant.size, material: variant.material, technique: variant.technique, priceModifier: variant.priceModifier, active: variant.active };
      const saved = variant.id
        ? await transaction.productVariant.update({ where: { id: variant.id }, data })
        : await transaction.productVariant.create({ data });
      await transaction.inventory.upsert({ where: { variantId: saved.id }, update: { tracked: variant.trackInventory, quantity: variant.quantity }, create: { variantId: saved.id, tracked: variant.trackInventory, quantity: variant.quantity } });
    }

    for (const mockup of preparedMockups) {
      const mockupData = { productId, name: mockup.name, view: mockup.view, imageUrl: mockup.imageUrl, widthPx: mockup.widthPx ?? 1024, heightPx: mockup.heightPx ?? 1024, position: mockup.position };
      if (existingMockups.has(mockup.id)) await transaction.mockup.update({ where: { id: mockup.id }, data: mockupData });
      else await transaction.mockup.create({ data: { id: mockup.id, ...mockupData } });
      for (const area of mockup.printAreas) {
        const areaData = { mockupId: mockup.id, name: area.name, x: area.x, y: area.y, width: area.width, height: area.height, realWidthCm: area.realWidthCm, realHeightCm: area.realHeightCm, allowOverflow: area.allowOverflow };
        if (existingMockups.get(mockup.id)?.has(area.id)) await transaction.printArea.update({ where: { id: area.id }, data: areaData });
        else await transaction.printArea.create({ data: { id: area.id, ...areaData } });
      }
    }

    await transaction.auditLog.create({ data: { actorId, action: "CATALOG_PRODUCT_UPDATED", entityType: "Product", entityId: product.id, before: { name: existing.name, slug: existing.slug, status: existing.status }, after: { name: product.name, slug: product.slug, status: product.status, readyMade: input.readyMade, mockupCount: preparedMockups.length, printAreaCount: activePrintAreaIds.length } } });
    return product;
  });
}
