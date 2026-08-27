import { customizationSpecSchema, productionElements } from "@/src/modules/customization/domain/customization";

describe("customization production spec", () => {
  it("keeps the original uploaded asset reference separate from preview", () => {
    const spec = customizationSpecSchema.parse({
      version: 1,
      productId: "product-1",
      instructions: "Quitar el fondo y centrar el nombre.",
      activeView: "FRONT",
      elements: [
        {
          id: "element-1",
          type: "IMAGE",
          assetId: "asset-original",
          originalStorageKey: "originals/sha256-art.png",
          printAreaId: "front",
          x: 10,
          y: 20,
          width: 200,
          height: 180,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          layerIndex: 0,
        },
      ],
      preview: { dataUrl: "data:image/png;base64,cHJldmlldw==", width: 800, height: 900 },
    });

    expect(productionElements(spec)[0]).toMatchObject({
      source: { assetId: "asset-original", originalStorageKey: "originals/sha256-art.png" },
    });
    expect(JSON.stringify(productionElements(spec))).not.toContain("base64");
  });

  it("rejects design instructions over the production-safe limit", () => {
    const result = customizationSpecSchema.safeParse({ version: 1, productId: "product-1", instructions: "a".repeat(1001), activeView: "FRONT", elements: [], preview: { width: 600, height: 675 } });
    expect(result.success).toBe(false);
  });
});
