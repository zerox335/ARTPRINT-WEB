import { describe, expect, it } from "vitest";
import { demoCaseProducts, importedPhoneReferenceCount } from "@/src/modules/catalog/infrastructure/demo-cases";

describe("phone case catalog", () => {
  it("models every phone reference as an independent customizable product", () => {
    expect(importedPhoneReferenceCount).toBe(461);
    expect(demoCaseProducts).toHaveLength(importedPhoneReferenceCount);
    expect(new Set(demoCaseProducts.map((product) => product.deviceModel)).size).toBe(demoCaseProducts.length);
    expect(demoCaseProducts.every((product) => product.categorySlug === "carcasas" && product.customizable)).toBe(true);
  });

  it("collapses visual styles into one black case for each model", () => {
    expect(demoCaseProducts.filter((product) => product.deviceModel === "iPhone 11")).toHaveLength(1);
    expect(demoCaseProducts.filter((product) => product.deviceModel === "iPhone 13")).toHaveLength(1);
    expect(demoCaseProducts.some((product) => product.deviceModel === "iPhone 11 Pro")).toBe(true);
    expect(demoCaseProducts.some((product) => product.deviceModel === "iPhone 11 Pro Max")).toBe(true);
  });

  it("never presents the shared placeholder as a calibrated product mockup", () => {
    const calibrated = demoCaseProducts.filter((product) => product.mockupStatus === "CALIBRATED");
    const referenceOnly = demoCaseProducts.filter((product) => product.mockupStatus === "REFERENCE_ONLY");
    expect(calibrated).toHaveLength(11);
    expect(referenceOnly).toHaveLength(450);
    expect(calibrated.every((product) => product.imageUrl !== "/products/mockups/cases/generic-black.svg")).toBe(true);
    expect(referenceOnly.every((product) => product.imageUrl === "/products/mockups/cases/generic-black.svg")).toBe(true);
  });

  it("uses three distinct calibrated templates for the iPhone 11 family", () => {
    const family = demoCaseProducts.filter((product) => product.series === "iPhone 11");
    expect(family.map((product) => product.deviceModel).sort()).toEqual(["iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"]);
    expect(new Set(family.map((product) => product.imageUrl)).size).toBe(3);
    expect(family.every((product) => product.mockupStatus === "CALIBRATED")).toBe(true);
  });

  it("includes brand, series and exact device model for data-driven filters", () => {
    for (const product of demoCaseProducts) {
      expect(product.brand).toBeTruthy();
      expect(product.series).toBeTruthy();
      expect(product.deviceModel).toBeTruthy();
      expect(product.name).toContain(product.deviceModel!);
    }
  });

  it("protects the camera module inside every model-specific print template", () => {
    for (const product of demoCaseProducts) {
      const area = product.printAreas[0]!;
      const camera = area.exclusions?.[0];
      expect(camera, product.name).toBeDefined();
      expect(area.x + area.width).toBeLessThanOrEqual(100);
      expect(area.y + area.height).toBeLessThanOrEqual(100);
      expect(camera!.x + camera!.width).toBeLessThanOrEqual(100);
      expect(camera!.y + camera!.height).toBeLessThanOrEqual(100);
      expect(camera!.x).toBeLessThan(area.x + area.width);
      expect(camera!.y).toBeLessThan(area.y + area.height);
      expect(camera!.x + camera!.width).toBeGreaterThan(area.x);
      expect(camera!.y + camera!.height).toBeGreaterThan(area.y);
    }
  });

  it("uses a unique SKU for every physical phone mold", () => {
    const skus = demoCaseProducts.flatMap((product) => product.variants.map((variant) => variant.sku));
    expect(new Set(skus).size).toBe(skus.length);
  });
});
