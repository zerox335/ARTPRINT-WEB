import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { createCatalogProduct, CatalogProductCreationError } from "@/src/modules/admin/application/create-catalog-product";
import { catalogProductInputSchema } from "@/src/modules/admin/domain/catalog-product-input";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const input = catalogProductInputSchema.parse(await request.json());
    const product = await createCatalogProduct(input, user.id);
    return NextResponse.json({ product, message: input.status === "ACTIVE" ? "Producto publicado" : "Borrador guardado" }, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogProductCreationError) {
      const messages = {
        CATEGORY_NOT_FOUND: "La categoría seleccionada no está disponible",
        ASSET_NOT_FOUND: "Alguna imagen no existe, no terminó de cargar o no pertenece a tu cuenta",
        CATALOG_CONFLICT: "Ya existe un producto con ese slug o una variante con ese SKU",
      } as const;
      return NextResponse.json({ error: error.code, message: messages[error.code] }, { status: error.code === "CATALOG_CONFLICT" ? 409 : 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "CATALOG_CONFLICT", message: "El slug, SKU o nombre de vista ya está en uso" }, { status: 409 });
    }
    return apiError(error);
  }
}
