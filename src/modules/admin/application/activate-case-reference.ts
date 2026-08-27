import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/infrastructure/database/prisma";
import type { CaseReferenceActivation } from "@/src/modules/admin/domain/case-reference-activation";

export class CaseReferenceActivationError extends Error {
  constructor(public readonly code: "REFERENCE_NOT_FOUND" | "REFERENCE_ALREADY_ACTIVE" | "ASSET_NOT_FOUND") {
    super(code);
  }
}

function metadataRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function activateCaseReference(productId: string, input: CaseReferenceActivation, actorId: string) {
  const [product, asset] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, category: { slug: "carcasas" } }, include: { images: { orderBy: { position: "asc" }, take: 1 } } }),
    prisma.uploadedAsset.findFirst({ where: { id: input.assetId, userId: actorId, status: "READY" }, select: { id: true, widthPx: true, heightPx: true } }),
  ]);
  if (!product) throw new CaseReferenceActivationError("REFERENCE_NOT_FOUND");
  const currentMetadata = metadataRecord(product.metadata);
  if (product.status !== "DRAFT" || currentMetadata.mockupStatus !== "REFERENCE_ONLY") throw new CaseReferenceActivationError("REFERENCE_ALREADY_ACTIVE");
  if (!asset) throw new CaseReferenceActivationError("ASSET_NOT_FOUND");

  const mockupId = `mockup-${randomUUID()}`;
  const areaId = `area-${randomUUID()}`;
  const exclusion = input.exclusion ? { id: `exclusion-${randomUUID()}`, ...input.exclusion } : null;
  const imageUrl = `/api/uploads/${asset.id}`;
  const nextMetadata = {
    ...currentMetadata,
    mockupStatus: "CALIBRATED",
    activePrintAreaIds: [areaId],
    printExclusions: exclusion ? { [areaId]: [exclusion] } : {},
  };

  return prisma.$transaction(async (transaction) => {
    if (product.images[0]) {
      await transaction.productImage.update({ where: { id: product.images[0].id }, data: { url: imageUrl, alt: `${product.name}, plantilla calibrada`, position: 0 } });
    } else {
      await transaction.productImage.create({ data: { productId: product.id, url: imageUrl, alt: `${product.name}, plantilla calibrada`, position: 0 } });
    }
    await transaction.mockup.create({
      data: {
        id: mockupId,
        productId: product.id,
        name: `Plantilla calibrada ${randomUUID().slice(0, 8)}`,
        view: "FRONT",
        imageUrl,
        widthPx: asset.widthPx ?? input.widthPx,
        heightPx: asset.heightPx ?? input.heightPx,
        position: 0,
        printAreas: { create: { id: areaId, name: input.area.name, x: input.area.x, y: input.area.y, width: input.area.width, height: input.area.height, realWidthCm: input.area.realWidthCm, realHeightCm: input.area.realHeightCm } },
      },
    });
    const activated = await transaction.product.update({ where: { id: product.id }, data: { status: "ACTIVE", customizable: true, metadata: nextMetadata as Prisma.InputJsonValue }, select: { id: true, name: true, slug: true, status: true } });
    await transaction.auditLog.create({ data: { actorId, action: "CASE_REFERENCE_ACTIVATED", entityType: "Product", entityId: product.id, before: { status: product.status, mockupStatus: typeof currentMetadata.mockupStatus === "string" ? currentMetadata.mockupStatus : null }, after: { status: "ACTIVE", mockupStatus: "CALIBRATED", mockupId, areaId } } });
    return activated;
  });
}
