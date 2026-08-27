import { describe, expect, it } from "vitest";
import { catalogProductInputSchema } from "@/src/modules/admin/domain/catalog-product-input";

const validProduct = {
  name: "Carcasa Galaxy A55",
  slug: "carcasa-galaxy-a55",
  categoryId: "cat-cases",
  productType: "CASE",
  shortDescription: "Carcasa lista para personalizar.",
  description: "Carcasa de TPU con lámina sublimable y molde específico para Galaxy A55.",
  basePrice: 28000,
  status: "ACTIVE",
  featured: false,
  customizable: true,
  brand: "Samsung",
  series: "Galaxy A",
  deviceModel: "Galaxy A55",
  leadTime: "3–6 días hábiles",
  techniques: ["Sublimación"],
  highlights: ["Molde específico"],
  variant: { sku: "AP-CASE-SA55", name: "Galaxy A55 / Blanco", priceModifier: 0, trackInventory: false, quantity: 0 },
  galleryAssetIds: ["asset-cover"],
  mockups: [{ assetId: "asset-cover", name: "Posterior", view: "BACK", widthPx: 1182, heightPx: 1330, printAreas: [{ name: "Posterior", x: 25, y: 5, width: 50, height: 90, realWidthCm: 7, realHeightCm: 14, exclusions: [{ name: "Cámaras", x: 27, y: 5, width: 25, height: 30, radius: 8 }] }] }],
} as const;

describe("admin catalog product input", () => {
  it("accepts a complete model-specific customizable product", () => {
    const parsed = catalogProductInputSchema.parse(validProduct);
    expect(parsed.variant.sku).toBe("AP-CASE-SA55");
    expect(parsed.mockups[0]?.printAreas[0]?.exclusions).toHaveLength(1);
  });

  it("rejects printable rectangles that escape the mockup", () => {
    const result = catalogProductInputSchema.safeParse({ ...validProduct, mockups: [{ ...validProduct.mockups[0], printAreas: [{ ...validProduct.mockups[0].printAreas[0], x: 80, width: 30 }] }] });
    expect(result.success).toBe(false);
  });

  it("requires an uploaded mockup for customizable products", () => {
    const result = catalogProductInputSchema.safeParse({ ...validProduct, mockups: [] });
    expect(result.success).toBe(false);
  });

  it("requires brand and exact device reference for phone cases", () => {
    const result = catalogProductInputSchema.safeParse({ ...validProduct, brand: undefined, deviceModel: undefined });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(expect.arrayContaining(["brand", "deviceModel"]));
  });
});
