import type { PrintExclusionView, ProductView } from "@/src/modules/catalog/domain/catalog";
import phoneCaseReferences from "@/src/modules/catalog/infrastructure/phone-case-references.generated.json";

type CaseDefinition = {
  id: string;
  slug: string;
  model: string;
  brand: string;
  series: string;
  sku: string;
  image: string;
  price: number;
  exclusion: Omit<PrintExclusionView, "id" | "name">;
  featured?: boolean;
};

const definitions: CaseDefinition[] = [
  {
    id: "prod-case-flex",
    slug: "carcasa-iphone-15",
    model: "iPhone 15",
    brand: "Apple",
    series: "iPhone 15",
    sku: "AP-CASE-IP15",
    image: "/products/mockups/cases/iphone-15.webp",
    price: 26000,
    exclusion: { x: 26, y: 4, width: 27, height: 25, radius: 10 },
    featured: true,
  },
  {
    id: "prod-case-ref-iphone-11",
    slug: "carcasa-iphone-11",
    model: "iPhone 11",
    brand: "Apple",
    series: "iPhone 11",
    sku: "AP-CASE-IP11",
    image: "/products/mockups/cases/iphone-11.svg",
    price: 26000,
    exclusion: { x: 26, y: 5, width: 20, height: 20, radius: 9 },
    featured: true,
  },
  {
    id: "prod-case-ref-iphone-11-pro",
    slug: "carcasa-iphone-11-pro",
    model: "iPhone 11 Pro",
    brand: "Apple",
    series: "iPhone 11",
    sku: "AP-CASE-IP11P",
    image: "/products/mockups/cases/iphone-11-pro.svg",
    price: 26000,
    exclusion: { x: 27, y: 6, width: 21, height: 22, radius: 9 },
  },
  {
    id: "prod-case-ref-iphone-11-pro-max",
    slug: "carcasa-iphone-11-pro-max",
    model: "iPhone 11 Pro Max",
    brand: "Apple",
    series: "iPhone 11",
    sku: "AP-CASE-IP11PM",
    image: "/products/mockups/cases/iphone-11-pro-max.svg",
    price: 28000,
    exclusion: { x: 26, y: 5, width: 23, height: 23, radius: 9 },
  },
  {
    id: "prod-case-iphone-14",
    slug: "carcasa-iphone-14",
    model: "iPhone 14",
    brand: "Apple",
    series: "iPhone 14",
    sku: "AP-CASE-IP14",
    image: "/products/mockups/cases/iphone-14.webp",
    price: 26000,
    exclusion: { x: 26, y: 4, width: 27, height: 25, radius: 10 },
  },
  {
    id: "prod-case-galaxy-a16",
    slug: "carcasa-samsung-galaxy-a16",
    model: "Galaxy A16",
    brand: "Samsung",
    series: "Galaxy A",
    sku: "AP-CASE-SA16",
    image: "/products/mockups/cases/galaxy-a16.webp",
    price: 25000,
    exclusion: { x: 29, y: 5, width: 22, height: 31, radius: 8 },
    featured: true,
  },
  {
    id: "prod-case-galaxy-a26",
    slug: "carcasa-samsung-galaxy-a26",
    model: "Galaxy A26",
    brand: "Samsung",
    series: "Galaxy A",
    sku: "AP-CASE-SA26",
    image: "/products/mockups/cases/galaxy-a26.webp",
    price: 26000,
    exclusion: { x: 29, y: 5, width: 24, height: 31, radius: 8 },
  },
  {
    id: "prod-case-galaxy-a36",
    slug: "carcasa-samsung-galaxy-a36",
    model: "Galaxy A36",
    brand: "Samsung",
    series: "Galaxy A",
    sku: "AP-CASE-SA36",
    image: "/products/mockups/cases/galaxy-a36.webp",
    price: 27000,
    exclusion: { x: 32, y: 6, width: 21, height: 31, radius: 8 },
  },
  {
    id: "prod-case-galaxy-s24",
    slug: "carcasa-samsung-galaxy-s24",
    model: "Galaxy S24",
    brand: "Samsung",
    series: "Galaxy S",
    sku: "AP-CASE-SS24",
    image: "/products/mockups/cases/galaxy-s24.webp",
    price: 29000,
    exclusion: { x: 28, y: 4, width: 25, height: 35, radius: 8 },
  },
  {
    id: "prod-case-redmi-note-13",
    slug: "carcasa-xiaomi-redmi-note-13",
    model: "Redmi Note 13",
    brand: "Xiaomi",
    series: "Redmi Note",
    sku: "AP-CASE-RN13",
    image: "/products/mockups/cases/redmi-note-13.webp",
    price: 25000,
    exclusion: { x: 27, y: 4, width: 31, height: 31, radius: 8 },
  },
  {
    id: "prod-case-moto-g54",
    slug: "carcasa-motorola-moto-g54",
    model: "Moto G54",
    brand: "Motorola",
    series: "Moto G",
    sku: "AP-CASE-MG54",
    image: "/products/mockups/cases/moto-g54.webp",
    price: 25000,
    exclusion: { x: 28, y: 5, width: 27, height: 29, radius: 8 },
  },
];

export type PhoneCaseReference = {
  brand: string;
  series: string;
  model: string;
  slug: string;
  sourceVariants: number;
};

export function phoneCaseReferenceKey(brand: string, model: string) {
  return `${brand} ${model}`
    .toLocaleLowerCase("es")
    .replace(/\b(?:apple|samsung|galaxy|xiaomi|motorola|moto)\b/g, " ")
    .replace(/\b[45]g\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const phoneCaseCatalogReferences = phoneCaseReferences as PhoneCaseReference[];

const specificReferenceKeys = new Set(definitions.map((definition) => phoneCaseReferenceKey(definition.brand, definition.model)));
const genericDefinitions: CaseDefinition[] = phoneCaseCatalogReferences
  .filter((reference) => !specificReferenceKeys.has(phoneCaseReferenceKey(reference.brand, reference.model)))
  .map((reference) => ({
    id: `prod-case-ref-${reference.slug}`,
    slug: `carcasa-${reference.slug}`,
    model: reference.model,
    brand: reference.brand,
    series: reference.series,
    sku: `AP-CASE-${reference.slug.toLocaleUpperCase("en")}`,
    image: "/products/mockups/cases/generic-black.svg",
    price: 26000,
    exclusion: { x: 26, y: 4, width: 31, height: 27, radius: 10 },
  }));

function createCaseProduct(definition: CaseDefinition): ProductView {
  const areaId = `area-case-${definition.sku.toLocaleLowerCase("en").replaceAll("ap-case-", "")}`;
  const isCalibratedMockup = definition.image !== "/products/mockups/cases/generic-black.svg";
  return {
    id: definition.id,
    name: `Carcasa ${definition.model}`,
    slug: definition.slug,
    categorySlug: "carcasas",
    categoryName: "Carcasas",
    shortDescription: `Carcasa compatible con ${definition.model}, lista para personalizar de borde a borde.`,
    description: isCalibratedMockup
      ? `Carcasa fabricada para ${definition.model}, con borde flexible de TPU y lámina posterior sublimable. El mockup y la zona de impresión están calibrados para el módulo de cámaras de esta referencia.`
      : `Carcasa compatible con ${definition.model}, con borde flexible de TPU y lámina posterior sublimable. La vista negra permite previsualizar el diseño; ArtPrint valida el recorte exacto de cámara antes de autorizar la producción.`,
    basePrice: definition.price,
    featured: definition.featured ?? false,
    customizable: true,
    imageUrl: definition.image,
    gallery: [definition.image],
    brand: definition.brand,
    series: definition.series,
    deviceModel: definition.model,
    badge: definition.featured ? "Referencia popular" : undefined,
    leadTime: "3–6 días hábiles",
    techniques: ["Sublimación", "UV"],
    variants: [
      {
        id: `var-${definition.sku.toLocaleLowerCase("en")}`,
        sku: definition.sku,
        name: `${definition.model} / Blanco sublimable`,
        color: "Blanco",
        colorHex: "#f7f7f4",
        size: definition.model,
        material: "TPU flexible + lámina sublimable",
        technique: "Sublimación",
        priceModifier: 0,
        available: true,
      },
    ],
    printAreas: [
      {
        id: areaId,
        key: "back",
        name: "Posterior",
        view: "BACK",
        x: 26,
        y: 5,
        width: 48,
        height: 88,
        realWidthCm: 7,
        realHeightCm: 14,
        exclusions: [
          {
            id: `${areaId}-camera`,
            name: "Módulo de cámaras",
            ...definition.exclusion,
          },
        ],
      },
    ],
    highlights: isCalibratedMockup
      ? ["Mockup calibrado por modelo", "Bordes de TPU", "Recorte de cámara protegido"]
      : ["Referencia verificada", "Bordes de TPU", "Validación de cámara antes de producir"],
    mockupStatus: isCalibratedMockup ? "CALIBRATED" : "REFERENCE_ONLY",
  };
}

export const demoCaseProducts: ProductView[] = [...definitions, ...genericDefinitions].map(createCaseProduct);
export const importedPhoneReferenceCount = phoneCaseCatalogReferences.length;
