import type { MetadataRoute } from "next";
import { catalogRepository } from "@/src/modules/catalog/infrastructure/catalog-repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const products = await catalogRepository.listProducts();
  return [{ url: base, changeFrequency: "weekly", priority: 1 }, { url: `${base}/catalogo`, changeFrequency: "daily", priority: .9 }, { url: `${base}/carcasas`, changeFrequency: "daily", priority: .9 }, ...products.map((product) => ({ url: `${base}/productos/${product.slug}`, changeFrequency: "weekly" as const, priority: .8 }))];
}
