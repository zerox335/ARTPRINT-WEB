import { calculateQuote, type PricingContext } from "@/src/modules/pricing/domain/price-engine";

const context: PricingContext = {
  productId: "shirt",
  productName: "Camiseta base",
  variantId: "shirt-black-m",
  sku: "SHIRT-BLK-M",
  basePrice: 22000,
  variantModifier: 0,
  areaPrices: {
    front: { SMALL: 5000, MEDIUM: 8000, LARGE: 12000 },
    back: { SMALL: 6000, MEDIUM: 9000, LARGE: 12000 },
    sleeve: { SMALL: 0, MEDIUM: 2000, LARGE: 4000 },
  },
  techniqueModifiers: { DTF: 0 },
  personalizedTextPrice: 3000,
  volumeTiers: [
    { minimum: 12, discountPercent: 5 },
    { minimum: 25, discountPercent: 10 },
  ],
};

describe("Price Engine", () => {
  it("reproduces the commercial pricing example on the backend", () => {
    const quote = calculateQuote(context, {
      variantId: "shirt-black-m",
      quantity: 1,
      technique: "DTF",
      areas: [
        { areaKey: "front", size: "SMALL", elementCount: 1, hasPersonalizedText: false },
        { areaKey: "back", size: "LARGE", elementCount: 1, hasPersonalizedText: false },
        { areaKey: "sleeve", size: "SMALL", elementCount: 1, hasPersonalizedText: true },
      ],
    });

    expect(quote.total).toBe(42000);
    expect(quote.currency).toBe("COP");
  });

  it("applies only the greatest matching volume tier", () => {
    const quote = calculateQuote(context, {
      variantId: "shirt-black-m",
      quantity: 25,
      technique: "DTF",
      areas: [{ areaKey: "front", size: "SMALL", elementCount: 1, hasPersonalizedText: false }],
    });

    expect(quote.subtotal).toBe(675000);
    expect(quote.discountPercent).toBe(10);
    expect(quote.discountTotal).toBe(67500);
    expect(quote.total).toBe(607500);
  });

  it("rejects an unknown variant instead of trusting client data", () => {
    expect(() =>
      calculateQuote(context, {
        variantId: "tampered-variant",
        quantity: 1,
        technique: "DTF",
        areas: [],
      }),
    ).toThrow("Variant does not match");
  });
});
