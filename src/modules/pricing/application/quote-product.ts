import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";
import {
  calculateQuote,
  type PriceQuote,
  type QuoteRequest,
} from "@/src/modules/pricing/domain/price-engine";

export async function quoteProduct(request: QuoteRequest): Promise<PriceQuote> {
  const product = await catalogRepository.findByVariantId(request.variantId);
  if (!product) throw new Error("Product variant not found");
  const variant = product.variants.find((item) => item.id === request.variantId);
  if (!variant || !variant.available) throw new Error("Product variant is unavailable");
  const areaPrices = Object.fromEntries(
    product.printAreas.map((area) => [
      area.key,
      area.key.includes("sleeve")
        ? { SMALL: 0, MEDIUM: 2000, LARGE: 4000 }
        : { SMALL: 5000, MEDIUM: 8000, LARGE: 12000 },
    ]),
  );

  return calculateQuote(
    {
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      sku: variant.sku,
      basePrice: product.basePrice,
      variantModifier: variant.priceModifier,
      areaPrices,
      techniqueModifiers: { DTF: 0, Sublimación: 0, "Vinilo textil": 2000, "Vinilo premium": 2500, UV: 4000, "Sublimación 3D": 5000 },
      personalizedTextPrice: 3000,
      volumeTiers: [
        { minimum: 12, discountPercent: 5 },
        { minimum: 25, discountPercent: 10 },
        { minimum: 50, discountPercent: 15 },
      ],
    },
    request,
  );
}
