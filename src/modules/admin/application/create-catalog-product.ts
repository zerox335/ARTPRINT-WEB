import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/infrastructure/database/prisma";
import type { CatalogProductInput, CatalogProductMetadata } from "@/src/modules/admin/domain/catalog-product-input";

export class CatalogProductCreationError extends Error {
  constructor(public readonly code: "CATEGORY_NOT_FOUND" | "ASSET_NOT_FOUND" | "CATALOG_CONFLICT") {
    super(code);
  }
}

export async function createCatalogProduct(input: CatalogProductInput, actorId: string) {
  const assetIds = [...new Set([...input.galleryAssetIds, ...input.mockups.map((mockup) => mockup.assetId)])];
  const [category, assets, conflict] = await Promise.all([
    prisma.category.findFirst({ where: { id: input.categoryId, active: true }, select: { id: true } }),
    prisma.uploadedAsset.findMany({ where: { id: { in: assetIds }, userId: actorId, status: "READY" }, select: { id: true, widthPx: true, heightPx: true } }),
    prisma.product.findFirst({ where: { OR: [{ slug: input.slug }, { variants: { some: { sku: input.variant.sku } } }] }, select: { id: true } }),
  ]);

  if (!category) throw new CatalogProductCreationError("CATEGORY_NOT_FOUND");
  if (assets.length !== assetIds.length) throw new CatalogProductCreationError("ASSET_NOT_FOUND");
  if (conflict) throw new CatalogProductCreationError("CATALOG_CONFLICT");

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const preparedMockups = input.mockups.map((mockup, mockupIndex) => ({
    ...mockup,
    id: `mockup-${randomUUID()}`,
    position: mockupIndex,
    widthPx: assetsById.get(mockup.assetId)?.widthPx ?? mockup.widthPx,
    heightPx: assetsById.get(mockup.assetId)?.heightPx ?? mockup.heightPx,
    printAreas: mockup.printAreas.map((area) => ({ ...area, id: `area-${randomUUID()}` })),
  }));

  const printExclusions: CatalogProductMetadata["printExclusions"] = Object.fromEntries(preparedMockups.flatMap((mockup) => mockup.printAreas.filter((area) => area.exclusions.length).map((area) => [area.id, area.exclusions.map((exclusion) => ({ id: `exclusion-${randomUUID()}`, ...exclusion }))])));
  const printAreaShapes: CatalogProductMetadata["printAreaShapes"] = Object.fromEntries(preparedMockups.flatMap((mockup) => mockup.printAreas.map((area) => [area.id, area.shape])));
  const metadata: CatalogProductMetadata = {
    productType: input.productType,
    leadTime: input.leadTime,
    techniques: [...new Set(input.techniques)],
    highlights: [...new Set(input.highlights)],
    ...(input.brand ? { brand: input.brand } : {}),
    ...(input.series ? { series: input.series } : {}),
    ...(input.deviceModel ? { deviceModel: input.deviceModel } : {}),
    ...(input.badge ? { badge: input.badge } : {}),
    mockupStatus: "CALIBRATED",
    activePrintAreaIds: preparedMockups.flatMap((mockup) => mockup.printAreas.map((area) => area.id)),
    printExclusions,
    printAreaShapes,
    readyMade: input.readyMade,
    ...(input.designTheme ? { designTheme: input.designTheme } : {}),
    designTags: [...new Set(input.designTags)],
  };

  return prisma.$transaction(async (transaction) => {
    const product = await transaction.product.create({
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
        metadata: metadata as unknown as Prisma.InputJsonValue,
        variants: {
          create: {
            sku: input.variant.sku,
            name: input.variant.name,
            color: input.variant.color,
            colorHex: input.variant.colorHex,
            size: input.variant.size,
            material: input.variant.material,
            technique: input.variant.technique,
            priceModifier: input.variant.priceModifier,
            active: true,
            inventory: { create: { tracked: input.variant.trackInventory, quantity: input.variant.quantity } },
          },
        },
        images: {
          create: input.galleryAssetIds.map((assetId, position) => ({ url: `/api/uploads/${assetId}`, alt: `${input.name}, imagen ${position + 1}`, position })),
        },
        mockups: {
          create: preparedMockups.map((mockup) => ({
            id: mockup.id,
            name: mockup.name,
            view: mockup.view,
            imageUrl: `/api/uploads/${mockup.assetId}`,
            widthPx: mockup.widthPx,
            heightPx: mockup.heightPx,
            position: mockup.position,
            printAreas: {
              create: mockup.printAreas.map((area) => ({
                id: area.id,
                name: area.name,
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height,
                realWidthCm: area.realWidthCm,
                realHeightCm: area.realHeightCm,
                allowOverflow: area.allowOverflow,
              })),
            },
          })),
        },
      },
      select: { id: true, name: true, slug: true, status: true },
    });

    await transaction.auditLog.create({
      data: {
        actorId,
        action: "CATALOG_PRODUCT_CREATED",
        entityType: "Product",
        entityId: product.id,
        after: { name: product.name, slug: product.slug, status: product.status, productType: input.productType, mockupCount: preparedMockups.length },
      },
    });
    return product;
  });
}
