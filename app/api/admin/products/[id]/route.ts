import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { updateCatalogProduct, CatalogProductUpdateError } from "@/src/modules/admin/application/update-catalog-product";
import { catalogProductUpdateSchema } from "@/src/modules/admin/domain/catalog-product-update";
import { requireUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertSameOrigin } from "@/src/shared/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const { id } = await params;
    const input = catalogProductUpdateSchema.parse(await request.json());
    const product = await updateCatalogProduct(id, input, user.id);
    return NextResponse.json({ product, message: "Producto, variantes y vistas actualizados" });
  } catch (error) {
    if (error instanceof CatalogProductUpdateError) {
      const messages = {
        PRODUCT_NOT_FOUND: "El producto ya no existe",
        CATEGORY_NOT_FOUND: "La categoría seleccionada no está disponible",
        ASSET_NOT_FOUND: "Alguna imagen no existe, no terminó de cargar o no pertenece a tu cuenta",
        CATALOG_CONFLICT: "El slug o alguno de los SKU ya está en uso",
        INVALID_REFERENCE: "Una variante, vista o área no pertenece a este producto",
      } as const;
      return NextResponse.json({ error: error.code, message: messages[error.code] }, { status: error.code === "PRODUCT_NOT_FOUND" ? 404 : error.code === "CATALOG_CONFLICT" ? 409 : 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "CATALOG_CONFLICT", message: "El slug, SKU o nombre de vista ya está en uso" }, { status: 409 });
    return apiError(error);
  }
}
