export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
};

export type ProductVariantView = {
  id: string;
  sku: string;
  name: string;
  color?: string;
  colorHex?: string;
  size?: string;
  material?: string;
  technique?: string;
  priceModifier: number;
  available: boolean;
};

export type PrintExclusionView = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
};

export type PrintAreaView = {
  id: string;
  key: string;
  name: string;
  view: "FRONT" | "BACK" | "LEFT_SLEEVE" | "RIGHT_SLEEVE" | "WRAP" | "CUSTOM";
  x: number;
  y: number;
  width: number;
  height: number;
  realWidthCm: number;
  realHeightCm: number;
  allowOverflow?: boolean;
  mirrorMockup?: boolean;
  mockupImageUrl?: string;
  exclusions?: PrintExclusionView[];
};

export type ProductView = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  featured: boolean;
  customizable: boolean;
  imageUrl: string;
  gallery: string[];
  brand?: string;
  series?: string;
  deviceModel?: string;
  badge?: string;
  leadTime: string;
  techniques: string[];
  variants: ProductVariantView[];
  printAreas: PrintAreaView[];
  highlights: string[];
  mockupStatus?: "CALIBRATED" | "REFERENCE_ONLY";
};

export interface CatalogRepository {
  listProducts(filters?: { category?: string; query?: string }): Promise<ProductView[]>;
  findBySlug(slug: string): Promise<ProductView | null>;
  findByVariantId(variantId: string): Promise<ProductView | null>;
  listCategories(): Promise<ProductCategory[]>;
}
