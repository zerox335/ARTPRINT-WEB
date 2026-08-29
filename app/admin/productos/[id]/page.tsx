import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/src/infrastructure/database/prisma";
import { CatalogProductEditor, type AdminProductEditorData } from "@/src/modules/admin/ui/catalog-product-editor";
import { currentUser } from "@/src/modules/identity/infrastructure/session";

export const metadata: Metadata = { title: "Editar producto · Administración", robots: { index: false, follow: false } };

function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

export default async function ConfigureProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar?next=/admin/productos");
  if (user.role !== "ADMIN") redirect("/admin");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { name: "asc" }, include: { inventory: true } }, images: { orderBy: { position: "asc" } }, mockups: { orderBy: { position: "asc" }, include: { printAreas: true } } } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  const metadata = record(product.metadata);
  const exclusionsByArea = record(metadata.printExclusions);
  const shapesByArea = record(metadata.printAreaShapes);
  const productType = ["TEXTILE", "CASE", "DRINKWARE", "ACCESSORY", "OTHER"].includes(String(metadata.productType)) ? String(metadata.productType) as AdminProductEditorData["productType"] : "OTHER";
  const initial: AdminProductEditorData = {
    id: product.id, name: product.name, slug: product.slug, categoryId: product.categoryId, productType, shortDescription: product.shortDescription, description: product.description, basePrice: product.basePrice, costPrice: product.costPrice ?? undefined, status: product.status, featured: product.featured, customizable: product.customizable,
    brand: typeof metadata.brand === "string" ? metadata.brand : undefined, series: typeof metadata.series === "string" ? metadata.series : undefined, deviceModel: typeof metadata.deviceModel === "string" ? metadata.deviceModel : undefined, badge: typeof metadata.badge === "string" ? metadata.badge : undefined,
    leadTime: typeof metadata.leadTime === "string" ? metadata.leadTime : "3–6 días hábiles", techniques: strings(metadata.techniques).length ? strings(metadata.techniques) : ["Sublimación"], highlights: strings(metadata.highlights), readyMade: metadata.readyMade === true, designTheme: typeof metadata.designTheme === "string" ? metadata.designTheme : undefined, designTags: strings(metadata.designTags),
    gallery: product.images.map((image) => ({ key: image.id, url: image.url, name: image.alt, width: 1024, height: 1024 })),
    variants: product.variants.map((variant) => ({ key: variant.id, id: variant.id, sku: variant.sku, name: variant.name, color: variant.color ?? undefined, colorHex: variant.colorHex ?? undefined, size: variant.size ?? undefined, material: variant.material ?? undefined, technique: variant.technique ?? undefined, priceModifier: variant.priceModifier, active: variant.active, trackInventory: variant.inventory?.tracked ?? false, quantity: variant.inventory?.quantity ?? 0 })),
    mockups: product.mockups.map((mockup) => {
      const areas = mockup.printAreas.map((area) => {
        const rawExclusions = Array.isArray(exclusionsByArea[area.id]) ? exclusionsByArea[area.id] as unknown[] : [];
        const exclusions = rawExclusions.flatMap((raw) => { const item = record(raw); return typeof item.name === "string" && typeof item.x === "number" && typeof item.y === "number" && typeof item.width === "number" && typeof item.height === "number" ? [{ key: typeof item.id === "string" ? item.id : `${area.id}-exclusion`, id: typeof item.id === "string" ? item.id : undefined, name: item.name, x: item.x, y: item.y, width: item.width, height: item.height, radius: typeof item.radius === "number" ? item.radius : 0 }] : []; });
        const shape: "RECTANGLE" | "ROUNDED" | "CIRCLE" = shapesByArea[area.id] === "ROUNDED" || shapesByArea[area.id] === "CIRCLE" ? shapesByArea[area.id] as "ROUNDED" | "CIRCLE" : "RECTANGLE";
        return { key: area.id, id: area.id, name: area.name, x: area.x, y: area.y, width: area.width, height: area.height, realWidthCm: area.realWidthCm, realHeightCm: area.realHeightCm, allowOverflow: area.allowOverflow, shape, exclusions };
      });
      return { key: mockup.id, id: mockup.id, name: mockup.name, view: mockup.view, imageUrl: mockup.imageUrl, widthPx: mockup.widthPx, heightPx: mockup.heightPx, areas, selectedAreaKey: areas[0]?.key ?? "" };
    }),
  };
  return <section className="container admin-page"><Link className="back-link" href="/admin/productos"><ArrowLeft size={16} /> Volver a productos</Link><div className="admin-top"><div><p className="eyebrow">Editor universal</p><h1>{product.name}</h1><p>Edita catálogo, variantes, inventario, fotografías, vistas y formas de personalización.</p></div></div><CatalogProductEditor initial={initial} categories={categories} /></section>;
}
