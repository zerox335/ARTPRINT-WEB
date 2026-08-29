import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCustomizer } from "@/src/modules/customization/ui/product-customizer";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";
import { env } from "@/src/shared/env";

export const metadata: Metadata = { title: "Personalizador", robots: { index: false, follow: false } };

export default async function CustomizePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ variant?: string; quantity?: string; edit?: string }> }) {
  const [route, query] = await Promise.all([params, searchParams]);
  const product = await catalogRepository.findBySlug(route.slug);
  if (!product || !product.customizable) notFound();
  return <ProductCustomizer product={product} initialVariantId={query.variant} initialQuantity={query.quantity ? Number(query.quantity) : undefined} editLineId={query.edit} previewOnly={env.DEMO_MODE === "true" || !env.DATABASE_URL} />;
}
