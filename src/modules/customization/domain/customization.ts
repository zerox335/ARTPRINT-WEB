import { z } from "zod";

const baseElementSchema = z.object({
  id: z.string().min(1).max(100),
  printAreaId: z.string().min(1).max(100),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().max(5000),
  height: z.number().positive().max(5000),
  scaleX: z.number().positive().max(20),
  scaleY: z.number().positive().max(20),
  rotation: z.number().min(-360).max(360),
  layerIndex: z.number().int().min(0).max(100),
});

const imageElementSchema = baseElementSchema.extend({
  type: z.literal("IMAGE"),
  assetId: z.string().min(1).max(100),
  originalStorageKey: z.string().min(1).max(500),
});

const textElementSchema = baseElementSchema.extend({
  type: z.literal("TEXT"),
  content: z.string().min(1).max(300),
  fontFamily: z.enum(["Inter", "Arial", "Georgia", "Courier New", "Trebuchet MS"]),
  fill: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  align: z.enum(["left", "center", "right"]),
});

export const customizationSpecSchema = z.object({
  version: z.literal(1),
  productId: z.string().min(1).max(100),
  instructions: z.string().trim().max(1000).optional(),
  activeView: z.enum(["FRONT", "BACK", "LEFT_SLEEVE", "RIGHT_SLEEVE", "WRAP", "CUSTOM"]),
  elements: z.array(z.discriminatedUnion("type", [imageElementSchema, textElementSchema])).max(100),
  preview: z.object({
    dataUrl: z.string().startsWith("data:image/").max(3_000_000).optional(),
    width: z.number().int().positive().max(2500),
    height: z.number().int().positive().max(2500),
  }),
});

export type CustomizationSpec = z.infer<typeof customizationSpecSchema>;

export function productionElements(spec: CustomizationSpec) {
  return spec.elements.map((element) => {
    if (element.type === "IMAGE") {
      return {
        ...element,
        source: { assetId: element.assetId, originalStorageKey: element.originalStorageKey },
      };
    }
    return element;
  });
}
