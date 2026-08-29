import type { CartLine } from "@/src/modules/cart/domain/cart";
import {
  checkoutItemsFromCart,
  shippingTotalForMerchandise,
} from "@/src/modules/checkout/domain/checkout";

const line: CartLine = {
  id: "line",
  productId: "product",
  productSlug: "camiseta",
  productName: "Camiseta",
  imageUrl: "/camiseta.svg",
  variant: { id: "variant", name: "Negra / M", sku: "TEE-BLK-M" },
  quantity: 2,
  technique: "DTF",
  areas: [{ areaKey: "front", size: "SMALL", elementCount: 1, hasPersonalizedText: false }],
  quote: {
    currency: "COP",
    quantity: 2,
    unitSubtotal: 1,
    unitPrice: 1,
    subtotal: 2,
    discountPercent: 0,
    discountTotal: 0,
    total: 2,
    lines: [],
    fingerprint: "tampered-browser-quote",
  },
};

describe("checkout domain", () => {
  it("never forwards browser prices or product snapshots to order creation", () => {
    const [item] = checkoutItemsFromCart([line]);
    expect(item).toEqual({
      variantId: "variant",
      quantity: 2,
      technique: "DTF",
      areas: line.areas,
      customization: undefined,
    });
    expect(item).not.toHaveProperty("quote");
    expect(item).not.toHaveProperty("productName");
  });

  it("applies the free-shipping threshold exactly", () => {
    expect(shippingTotalForMerchandise(149_999)).toBe(9_000);
    expect(shippingTotalForMerchandise(150_000)).toBe(0);
    expect(shippingTotalForMerchandise(20_000, "PICKUP")).toBe(0);
  });
});
