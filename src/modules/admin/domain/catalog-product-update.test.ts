import { describe, expect, it } from "vitest";
import { catalogProductUpdateSchema } from "@/src/modules/admin/domain/catalog-product-update";

const validUpdate = {
  name: "Camiseta anime lista",
  slug: "camiseta-anime-lista",
  categoryId: "cat-textiles",
  productType: "TEXTILE",
  shortDescription: "Diseño anime listo para personalizar.",
  description: "Camiseta con un diseño listo que el cliente puede ajustar antes de comprar.",
  basePrice: 32000,
  status: "ACTIVE",
  featured: true,
  customizable: true,
  leadTime: "3–5 días hábiles",
  techniques: ["DTF"],
  highlights: ["Diseño editable"],
  readyMade: true,
  designTheme: "Anime",
  designTags: ["dragón", "juvenil"],
  gallery: [{ url: "/products/textiles/camiseta-real-front.webp" }],
  variants: [{ sku: "AP-ANIME-M", name: "Negro / M", priceModifier: 0, active: true, trackInventory: true, quantity: 4 }],
  mockups: [{ url: "/products/textiles/camiseta-real-front.webp", name: "Frente", view: "FRONT", widthPx: 1024, heightPx: 1024, printAreas: [{ name: "Pecho", x: 25, y: 18, width: 50, height: 55, realWidthCm: 30, realHeightCm: 38, shape: "ROUNDED", exclusions: [] }] }],
} as const;

describe("admin catalog product update", () => {
  it("accepts editable variants, ready-made metadata and shaped print areas", () => {
    const parsed = catalogProductUpdateSchema.parse(validUpdate);
    expect(parsed.readyMade).toBe(true);
    expect(parsed.mockups[0]?.printAreas[0]?.shape).toBe("ROUNDED");
    expect(parsed.variants[0]?.quantity).toBe(4);
  });

  it("requires a theme for a ready-made design", () => {
    const result = catalogProductUpdateSchema.safeParse({ ...validUpdate, designTheme: undefined });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.join(".") === "designTheme")).toBe(true);
  });

  it("rejects external image URLs and print areas outside the mockup", () => {
    const external = catalogProductUpdateSchema.safeParse({ ...validUpdate, gallery: [{ url: "https://example.com/design.png" }] });
    const escaped = catalogProductUpdateSchema.safeParse({ ...validUpdate, mockups: [{ ...validUpdate.mockups[0], printAreas: [{ ...validUpdate.mockups[0].printAreas[0], x: 80, width: 30 }] }] });
    expect(external.success).toBe(false);
    expect(escaped.success).toBe(false);
  });
});
