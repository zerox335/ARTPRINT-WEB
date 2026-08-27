import { describe, expect, it } from "vitest";
import { demoProducts } from "@/src/modules/catalog/infrastructure/demo-catalog";

const drinkware = demoProducts.filter((product) => product.categorySlug === "mugs-termos");

describe("drinkware mockups", () => {
  it("assigns a unique product mockup to every drinkware format", () => {
    expect(drinkware).toHaveLength(6);
    expect(new Set(drinkware.map((product) => product.imageUrl)).size).toBe(drinkware.length);
    expect(drinkware.every((product) => product.imageUrl.startsWith("/products/mockups/"))).toBe(true);
  });

  it("keeps every printable area inside its mockup", () => {
    for (const product of drinkware) {
      expect(product.printAreas.length).toBeGreaterThan(0);
      for (const area of product.printAreas) {
        expect(area.x).toBeGreaterThanOrEqual(0);
        expect(area.y).toBeGreaterThanOrEqual(0);
        expect(area.x + area.width).toBeLessThanOrEqual(100);
        expect(area.y + area.height).toBeLessThanOrEqual(100);
        expect(area.realWidthCm).toBeGreaterThan(0);
        expect(area.realHeightCm).toBeGreaterThan(0);
      }
    }
  });

  it("uses unique SKUs for independently sellable formats", () => {
    const skus = drinkware.flatMap((product) => product.variants.map((variant) => variant.sku));
    expect(new Set(skus).size).toBe(skus.length);
  });
});
