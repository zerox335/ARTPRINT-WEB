import { z } from "zod";

const optionalLabel = z.string().trim().max(120).optional();
const percentage = z.number().min(0).max(100);
const internalImageUrl = z.string().trim().max(500).refine((value) => value.startsWith("/api/uploads/") || value.startsWith("/products/") || value.startsWith("/brand/"), "La imagen debe pertenecer a ArtPrint");

const visualSourceSchema = z.object({
  assetId: z.string().min(1).max(120).optional(),
  url: internalImageUrl.optional(),
}).refine((source) => Boolean(source.assetId || source.url), "Selecciona una imagen");

const rectangleSchema = z.object({
  x: percentage,
  y: percentage,
  width: z.number().gt(0).max(100),
  height: z.number().gt(0).max(100),
}).superRefine((rectangle, context) => {
  if (rectangle.x + rectangle.width > 100) context.addIssue({ code: "custom", path: ["width"], message: "La zona supera el ancho del mockup" });
  if (rectangle.y + rectangle.height > 100) context.addIssue({ code: "custom", path: ["height"], message: "La zona supera el alto del mockup" });
});

const exclusionSchema = rectangleSchema.and(z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().trim().min(2).max(80),
  radius: z.number().min(0).max(50).optional(),
}));

const printAreaSchema = rectangleSchema.and(z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().trim().min(2).max(80),
  realWidthCm: z.number().gt(0).max(300),
  realHeightCm: z.number().gt(0).max(300),
  allowOverflow: z.boolean().default(false),
  shape: z.enum(["RECTANGLE", "ROUNDED", "CIRCLE"]).default("RECTANGLE"),
  exclusions: z.array(exclusionSchema).max(6).default([]),
}));

const mockupSchema = visualSourceSchema.and(z.object({
  id: z.string().min(1).max(120).optional(),
  name: z.string().trim().min(2).max(80),
  view: z.enum(["FRONT", "BACK", "LEFT_SLEEVE", "RIGHT_SLEEVE", "WRAP", "CUSTOM"]),
  widthPx: z.number().int().min(100).max(12000),
  heightPx: z.number().int().min(100).max(12000),
  printAreas: z.array(printAreaSchema).min(1).max(8),
}));

const variantSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]+$/).max(60),
  name: z.string().trim().min(2).max(120),
  color: optionalLabel,
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size: optionalLabel,
  material: optionalLabel,
  technique: optionalLabel,
  priceModifier: z.number().int().min(-100_000_000).max(100_000_000).default(0),
  active: z.boolean().default(true),
  trackInventory: z.boolean().default(false),
  quantity: z.number().int().min(0).max(10_000_000).default(0),
});

export const catalogProductUpdateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140),
  categoryId: z.string().min(1).max(120),
  productType: z.enum(["TEXTILE", "CASE", "DRINKWARE", "ACCESSORY", "OTHER"]),
  shortDescription: z.string().trim().min(10).max(220),
  description: z.string().trim().min(20).max(5000),
  basePrice: z.number().int().min(1000).max(100_000_000),
  costPrice: z.number().int().min(0).max(100_000_000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean().default(false),
  customizable: z.boolean().default(true),
  brand: optionalLabel,
  series: optionalLabel,
  deviceModel: optionalLabel,
  badge: optionalLabel,
  leadTime: z.string().trim().min(2).max(120),
  techniques: z.array(z.string().trim().min(2).max(80)).min(1).max(12),
  highlights: z.array(z.string().trim().min(2).max(120)).max(12),
  readyMade: z.boolean().default(false),
  designTheme: optionalLabel,
  designTags: z.array(z.string().trim().min(2).max(60)).max(20).default([]),
  gallery: z.array(visualSourceSchema).min(1).max(20),
  variants: z.array(variantSchema).min(1).max(100),
  mockups: z.array(mockupSchema).max(12),
}).superRefine((product, context) => {
  if (product.customizable && product.mockups.length === 0) context.addIssue({ code: "custom", path: ["mockups"], message: "Un producto personalizable necesita al menos una vista" });
  if (product.readyMade && !product.designTheme) context.addIssue({ code: "custom", path: ["designTheme"], message: "Indica el tema del diseño listo" });
});

export type CatalogProductUpdate = z.infer<typeof catalogProductUpdateSchema>;
