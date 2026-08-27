import type { CatalogRepository, PrintExclusionView, ProductView } from "@/src/modules/catalog/domain/catalog";
import { prisma } from "@/src/infrastructure/database/prisma";
import { env } from "@/src/shared/env";
import { demoCatalog } from "@/src/modules/catalog/infrastructure/demo-catalog";

type DbProduct = Awaited<ReturnType<typeof loadDbProducts>>[number];

function parsePrintExclusions(metadata: Record<string, unknown>): Record<string, PrintExclusionView[]> {
  const value = metadata.printExclusions;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([areaId, exclusions]) => {
    if (!Array.isArray(exclusions)) return [areaId, []];
    return [areaId, exclusions.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const entry = item as Record<string, unknown>;
      if (typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.x !== "number" || typeof entry.y !== "number" || typeof entry.width !== "number" || typeof entry.height !== "number") return [];
      return [{ id: entry.id, name: entry.name, x: entry.x, y: entry.y, width: entry.width, height: entry.height, ...(typeof entry.radius === "number" ? { radius: entry.radius } : {}) }];
    })];
  }));
}

async function loadDbProducts(where?: { slug?: string; variantId?: string; category?: string; query?: string }) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(where?.slug ? { slug: where.slug } : {}),
      ...(where?.variantId ? { variants: { some: { id: where.variantId, active: true } } } : {}),
      ...(where?.category ? { category: { slug: where.category } } : {}),
      ...(where?.query ? { OR: [{ name: { contains: where.query, mode: "insensitive" as const } }, { shortDescription: { contains: where.query, mode: "insensitive" as const } }] } : {}),
    },
    include: { category: true, variants: { where: { active: true }, orderBy: { name: "asc" } }, images: { orderBy: { position: "asc" } }, mockups: { orderBy: { position: "asc" }, include: { printAreas: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

function mapProduct(product: DbProduct): ProductView {
  const metadata = product.metadata && typeof product.metadata === "object" && !Array.isArray(product.metadata) ? product.metadata as Record<string, unknown> : {};
  const leadTime = typeof metadata.leadTime === "string" ? metadata.leadTime : "3–6 días hábiles";
  const techniques = Array.isArray(metadata.techniques) ? metadata.techniques.filter((item): item is string => typeof item === "string") : [...new Set(product.variants.map((variant) => variant.technique).filter((item): item is string => Boolean(item)))];
  const highlights = Array.isArray(metadata.highlights) ? metadata.highlights.filter((item): item is string => typeof item === "string") : [];
  const printExclusions = parsePrintExclusions(metadata);
  const mockupStatus = metadata.mockupStatus === "REFERENCE_ONLY" ? "REFERENCE_ONLY" : "CALIBRATED";
  const activePrintAreaIds = Array.isArray(metadata.activePrintAreaIds) ? new Set(metadata.activePrintAreaIds.filter((item): item is string => typeof item === "string")) : null;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    shortDescription: product.shortDescription,
    description: product.description,
    basePrice: product.basePrice,
    featured: product.featured,
    customizable: product.customizable,
    imageUrl: product.images[0]?.url ?? product.mockups[0]?.imageUrl ?? "/products/camiseta.svg",
    gallery: product.images.map((image) => image.url),
    brand: typeof metadata.brand === "string" ? metadata.brand : undefined,
    series: typeof metadata.series === "string" ? metadata.series : undefined,
    deviceModel: typeof metadata.deviceModel === "string" ? metadata.deviceModel : undefined,
    badge: typeof metadata.badge === "string" ? metadata.badge : undefined,
    leadTime,
    techniques: techniques.length ? techniques : ["DTF"],
    variants: product.variants.map((variant) => ({ id: variant.id, sku: variant.sku, name: variant.name, color: variant.color ?? undefined, colorHex: variant.colorHex ?? undefined, size: variant.size ?? undefined, material: variant.material ?? undefined, technique: variant.technique ?? undefined, priceModifier: variant.priceModifier, available: variant.active })),
    printAreas: product.mockups.flatMap((mockup) => mockup.printAreas.filter((area) => !activePrintAreaIds || activePrintAreaIds.has(area.id)).map((area) => ({ id: area.id, key: `${mockup.view.toLocaleLowerCase("en")}-${area.name.toLocaleLowerCase("es").replaceAll(" ", "-")}`, name: area.name, view: mockup.view, x: area.x, y: area.y, width: area.width, height: area.height, realWidthCm: area.realWidthCm, realHeightCm: area.realHeightCm, allowOverflow: area.allowOverflow, mirrorMockup: mockup.view === "RIGHT_SLEEVE", mockupImageUrl: mockup.imageUrl, exclusions: printExclusions[area.id] }))),
    highlights,
    mockupStatus,
  };
}

class HybridCatalogRepository implements CatalogRepository {
  private async withFallback<T>(database: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (env.DEMO_MODE === "true") return fallback();
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required when DEMO_MODE is disabled");
    return database();
  }
  listProducts(filters?: { category?: string; query?: string }) { return this.withFallback(async () => (await loadDbProducts(filters)).map(mapProduct), () => demoCatalog.listProducts(filters)); }
  findBySlug(slug: string) { return this.withFallback(async () => { const [product] = await loadDbProducts({ slug }); return product ? mapProduct(product) : null; }, () => demoCatalog.findBySlug(slug)); }
  findByVariantId(variantId: string) { return this.withFallback(async () => { const [product] = await loadDbProducts({ variantId }); return product ? mapProduct(product) : null; }, () => demoCatalog.findByVariantId(variantId)); }
  listCategories() { return this.withFallback(async () => prisma.category.findMany({ where: { active: true }, orderBy: { position: "asc" }, select: { id: true, name: true, slug: true, description: true, imageUrl: true } }).then((items) => items.map((item) => ({ ...item, description: item.description ?? "", imageUrl: item.imageUrl ?? "/products/camiseta.svg" }))), () => demoCatalog.listCategories()); }
}

export const catalogRepository = new HybridCatalogRepository();
