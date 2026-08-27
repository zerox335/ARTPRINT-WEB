import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/src/infrastructure/database/prisma";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertSameOrigin } from "@/src/shared/http";

const categoryInput = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().min(10).max(300),
  imageAssetId: z.string().min(1).max(120).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const input = categoryInput.parse(await request.json());
    const [asset, highest] = await Promise.all([
      input.imageAssetId ? prisma.uploadedAsset.findFirst({ where: { id: input.imageAssetId, userId: user.id, status: "READY" }, select: { id: true } }) : null,
      prisma.category.aggregate({ _max: { position: true } }),
    ]);
    if (input.imageAssetId && !asset) return NextResponse.json({ error: "ASSET_NOT_FOUND", message: "La imagen de categoría no está disponible" }, { status: 400 });
    const category = await prisma.category.create({ data: { name: input.name, slug: input.slug, description: input.description, imageUrl: asset ? `/api/uploads/${asset.id}` : "/products/camiseta.svg", position: (highest._max.position ?? -1) + 1, active: true }, select: { id: true, name: true, slug: true } });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "CATALOG_CATEGORY_CREATED", entityType: "Category", entityId: category.id, after: category } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "CATEGORY_CONFLICT", message: "Ya existe una categoría con ese slug" }, { status: 409 });
    return apiError(error);
  }
}
