import { z } from "zod";

const percentage = z.number().min(0).max(100);
const rectangleSchema = z.object({
  x: percentage,
  y: percentage,
  width: z.number().gt(0).max(100),
  height: z.number().gt(0).max(100),
}).superRefine((rectangle, context) => {
  if (rectangle.x + rectangle.width > 100) context.addIssue({ code: "custom", path: ["width"], message: "La zona supera el ancho del mockup" });
  if (rectangle.y + rectangle.height > 100) context.addIssue({ code: "custom", path: ["height"], message: "La zona supera el alto del mockup" });
});

export const caseReferenceActivationSchema = z.object({
  assetId: z.string().min(1).max(120),
  widthPx: z.number().int().min(100).max(12000),
  heightPx: z.number().int().min(100).max(12000),
  area: rectangleSchema.and(z.object({
    name: z.string().trim().min(2).max(80),
    realWidthCm: z.number().gt(0).max(100),
    realHeightCm: z.number().gt(0).max(100),
  })),
  exclusion: rectangleSchema.and(z.object({
    name: z.string().trim().min(2).max(80),
    radius: z.number().min(0).max(50).optional(),
  })).optional(),
});

export type CaseReferenceActivation = z.infer<typeof caseReferenceActivationSchema>;
