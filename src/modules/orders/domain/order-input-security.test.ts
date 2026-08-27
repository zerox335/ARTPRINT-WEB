import { quoteRequestSchema } from "@/src/modules/pricing/domain/price-engine";

describe("checkout input security", () => {
  it("strips prices supplied by the browser", () => {
    const parsed = quoteRequestSchema.parse({ variantId: "variant", quantity: 2, technique: "DTF", areas: [], unitPrice: 1, total: 2 });
    expect(parsed).not.toHaveProperty("unitPrice");
    expect(parsed).not.toHaveProperty("total");
  });

  it("rejects abusive quantities", () => {
    expect(() => quoteRequestSchema.parse({ variantId: "variant", quantity: 1001, technique: "DTF", areas: [] })).toThrow();
  });
});
