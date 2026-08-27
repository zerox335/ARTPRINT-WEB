import type {
  CatalogRepository,
  ProductCategory,
  ProductView,
} from "@/src/modules/catalog/domain/catalog";
import { demoDrinkwareProducts } from "@/src/modules/catalog/infrastructure/demo-drinkware";
import { demoCaseProducts } from "@/src/modules/catalog/infrastructure/demo-cases";

export const demoCategories: ProductCategory[] = [
  {
    id: "cat-textiles",
    name: "Textiles",
    slug: "textiles",
    description: "Prendas listas para convertir una idea en una pieza única.",
    imageUrl: "/products/textiles/camiseta-real-front.webp",
  },
  {
    id: "cat-drinkware",
    name: "Mugs, vasos & termos",
    slug: "mugs-termos",
    description: "Cerámica, vidrio y acero con un mockup propio para cada formato.",
    imageUrl: "/products/mockups/mug-ceramico.webp",
  },
  {
    id: "cat-accessories",
    name: "Carcasas",
    slug: "carcasas",
    description: "Una plantilla exacta y personalizable para cada referencia de celular.",
    imageUrl: "/products/mockups/cases/iphone-15.webp",
  },
];

export const demoProducts: ProductView[] = [
  {
    id: "prod-camiseta-premium",
    name: "Camiseta Premium",
    slug: "camiseta-premium",
    categorySlug: "textiles",
    categoryName: "Textiles",
    shortDescription: "Algodón suave, impresión vibrante y ajuste contemporáneo.",
    description:
      "Una camiseta versátil para regalos, equipos y marcas. Personaliza frente, espalda o manga y recibe una prueba antes de producción.",
    basePrice: 22000,
    featured: true,
    customizable: true,
    imageUrl: "/products/textiles/camiseta-real-front.webp",
    gallery: ["/products/textiles/camiseta-real-front.webp", "/products/textiles/camiseta-real-back.webp", "/products/textiles/camiseta-real-side.webp"],
    badge: "Más elegido",
    leadTime: "3–5 días hábiles",
    techniques: ["DTF", "Sublimación", "Vinilo textil"],
    variants: [
      { id: "var-tee-white-m", sku: "AP-TEE-WHT-M", name: "Blanco / M / Algodón", color: "Blanco", colorHex: "#f5f3ee", size: "M", material: "Algodón", priceModifier: 0, available: true },
      { id: "var-tee-black-m", sku: "AP-TEE-BLK-M", name: "Negro / M / Algodón", color: "Negro", colorHex: "#17191c", size: "M", material: "Algodón", priceModifier: 0, available: true },
      { id: "var-tee-black-l", sku: "AP-TEE-BLK-L", name: "Negro / L / Algodón", color: "Negro", colorHex: "#17191c", size: "L", material: "Algodón", priceModifier: 0, available: true },
      { id: "var-tee-blue-xl", sku: "AP-TEE-BLU-XL", name: "Azul / XL / Dry Fit", color: "Azul", colorHex: "#2949a6", size: "XL", material: "Dry Fit", priceModifier: 6000, available: true },
      { id: "var-tee-red-xxl", sku: "AP-TEE-RED-XXL", name: "Rojo / XXL / Algodón", color: "Rojo", colorHex: "#c73947", size: "XXL", material: "Algodón", priceModifier: 3000, available: true },
    ],
    printAreas: [
      { id: "area-tee-front", key: "front", name: "Frente completo", view: "FRONT", x: 8, y: 7, width: 84, height: 87, realWidthCm: 58, realHeightCm: 72, allowOverflow: true, mockupImageUrl: "/products/textiles/camiseta-real-front.webp" },
      { id: "area-tee-back", key: "back", name: "Espalda completa", view: "BACK", x: 8, y: 7, width: 84, height: 87, realWidthCm: 58, realHeightCm: 72, allowOverflow: true, mockupImageUrl: "/products/textiles/camiseta-real-back.webp" },
      { id: "area-tee-left", key: "left-sleeve", name: "Lateral izquierdo", view: "LEFT_SLEEVE", x: 17, y: 8, width: 66, height: 87, realWidthCm: 34, realHeightCm: 72, allowOverflow: true, mockupImageUrl: "/products/textiles/camiseta-real-side.webp" },
      { id: "area-tee-right", key: "right-sleeve", name: "Lateral derecho", view: "RIGHT_SLEEVE", x: 17, y: 8, width: 66, height: 87, realWidthCm: 34, realHeightCm: 72, allowOverflow: true, mirrorMockup: true, mockupImageUrl: "/products/textiles/camiseta-real-side.webp" },
    ],
    highlights: ["180 g/m²", "Tallas S a XXL", "Prueba de diseño incluida"],
  },
  {
    id: "prod-mug-ceramico",
    name: "Mug Cerámico",
    slug: "mug-ceramico",
    categorySlug: "mugs-termos",
    categoryName: "Mugs, vasos & termos",
    shortDescription: "Color nítido de borde a borde para cada momento.",
    description: "Mug blanco de 11 oz con acabado brillante y área envolvente de sublimación.",
    basePrice: 18000,
    featured: true,
    customizable: true,
    imageUrl: "/products/mockups/mug-ceramico.webp",
    gallery: ["/products/mockups/mug-ceramico.webp"],
    badge: "Regalo favorito",
    leadTime: "2–4 días hábiles",
    techniques: ["Sublimación"],
    variants: [
      { id: "var-mug-white-11", sku: "AP-MUG-WHT-11", name: "Blanco / 11 oz", color: "Blanco", colorHex: "#f8f6f1", size: "11 oz", material: "Cerámica", technique: "Sublimación", priceModifier: 0, available: true },
    ],
    printAreas: [
      { id: "area-mug-wrap", key: "wrap", name: "Área envolvente", view: "WRAP", x: 13, y: 25, width: 52, height: 45, realWidthCm: 20, realHeightCm: 9 },
    ],
    highlights: ["11 oz", "Apto para microondas", "Acabado brillante"],
  },
  ...demoDrinkwareProducts,
  {
    id: "prod-termo-acero",
    name: "Termo Acero 600 ml",
    slug: "termo-acero-600",
    categorySlug: "mugs-termos",
    categoryName: "Mugs, vasos & termos",
    shortDescription: "Temperatura, estilo y marca durante todo el día.",
    description: "Termo de acero de doble pared, tapa hermética y personalización resistente.",
    basePrice: 34000,
    featured: true,
    customizable: true,
    imageUrl: "/products/mockups/termo-acero.webp",
    gallery: ["/products/mockups/termo-acero.webp"],
    leadTime: "3–5 días hábiles",
    techniques: ["Sublimación", "Vinilo premium"],
    variants: [
      { id: "var-termo-white-600", sku: "AP-TRM-WHT-600", name: "Blanco / 600 ml", color: "Blanco", colorHex: "#f4f2ed", size: "600 ml", material: "Acero inoxidable", technique: "Sublimación", priceModifier: 0, available: true },
    ],
    printAreas: [
      { id: "area-termo-front", key: "front", name: "Frente", view: "FRONT", x: 40, y: 24, width: 20, height: 56, realWidthCm: 8, realHeightCm: 16 },
    ],
    highlights: ["Doble pared", "600 ml", "Tapa hermética"],
  },
  ...demoCaseProducts,
];

export class DemoCatalogRepository implements CatalogRepository {
  async listProducts(filters?: { category?: string; query?: string }) {
    const query = filters?.query?.trim().toLocaleLowerCase("es");
    return demoProducts.filter((product) => {
      if (product.mockupStatus === "REFERENCE_ONLY") return false;
      const inCategory = !filters?.category || product.categorySlug === filters.category;
      const matchesQuery =
        !query ||
        product.name.toLocaleLowerCase("es").includes(query) ||
        product.shortDescription.toLocaleLowerCase("es").includes(query);
      return inCategory && matchesQuery;
    });
  }

  async findBySlug(slug: string) {
    return demoProducts.find((product) => product.slug === slug && product.mockupStatus !== "REFERENCE_ONLY") ?? null;
  }

  async findByVariantId(variantId: string) {
    return demoProducts.find((product) => product.mockupStatus !== "REFERENCE_ONLY" && product.variants.some((variant) => variant.id === variantId)) ?? null;
  }

  async listCategories() {
    return demoCategories;
  }
}

export const demoCatalog = new DemoCatalogRepository();
