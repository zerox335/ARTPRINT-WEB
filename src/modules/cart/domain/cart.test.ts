import { appendCartLine, cartTotals, removeCartLine, replaceCartLine, type CartLine } from "@/src/modules/cart/domain/cart";

const baseLine: Omit<CartLine, "id"> = {
  productId: "product",
  productSlug: "camiseta",
  productName: "Camiseta",
  imageUrl: "/camiseta.svg",
  variant: { id: "variant", name: "Negra / M", sku: "TEE-BLK-M" },
  quantity: 2,
  technique: "DTF",
  areas: [],
  quote: {
    currency: "COP",
    quantity: 2,
    unitSubtotal: 25000,
    unitPrice: 25000,
    subtotal: 50000,
    discountPercent: 0,
    discountTotal: 0,
    total: 50000,
    lines: [],
    fingerprint: "quote-fingerprint",
  },
};

describe("cart domain", () => {
  it("adds lines and derives quantity and server-quoted total", () => {
    const lines = appendCartLine([], baseLine, "line-1");
    expect(lines[0]?.id).toBe("line-1");
    expect(cartTotals(lines)).toEqual({ itemCount: 2, total: 50000 });
  });

  it("replaces and removes a line without mutating the original array", () => {
    const original = appendCartLine([], baseLine, "line-1");
    const replacement = { ...original[0]!, quantity: 1, quote: { ...original[0]!.quote, total: 25000 } };
    const replaced = replaceCartLine(original, "line-1", replacement);

    expect(cartTotals(replaced)).toEqual({ itemCount: 1, total: 25000 });
    expect(original[0]?.quantity).toBe(2);
    expect(removeCartLine(replaced, "line-1")).toEqual([]);
  });
});
