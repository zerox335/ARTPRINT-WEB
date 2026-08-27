import { z } from "zod";
import { assertMoney } from "@/src/shared/money";

export const quoteRequestSchema = z.object({
  variantId: z.string().min(1).max(100),
  quantity: z.coerce.number().int().min(1).max(1000),
  technique: z.string().min(1).max(80),
  areas: z
    .array(
      z.object({
        areaKey: z.string().min(1).max(80),
        size: z.enum(["SMALL", "MEDIUM", "LARGE"]),
        elementCount: z.number().int().min(1).max(50),
        hasPersonalizedText: z.boolean().default(false),
      }),
    )
    .max(4),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export type PricingContext = {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  basePrice: number;
  variantModifier: number;
  areaPrices: Record<string, Partial<Record<QuoteRequest["areas"][number]["size"], number>>>;
  techniqueModifiers: Record<string, number>;
  personalizedTextPrice: number;
  volumeTiers: Array<{ minimum: number; discountPercent: number }>;
};

export type QuoteLine = {
  code: string;
  label: string;
  amount: number;
  kind: "BASE" | "VARIANT" | "TECHNIQUE" | "PRINT_AREA" | "EXTRA" | "DISCOUNT";
};

export type PriceQuote = {
  currency: "COP";
  quantity: number;
  unitSubtotal: number;
  discountPercent: number;
  unitPrice: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  lines: QuoteLine[];
  fingerprint: string;
};

export function calculateQuote(context: PricingContext, rawRequest: QuoteRequest): PriceQuote {
  const request = quoteRequestSchema.parse(rawRequest);
  if (context.variantId !== request.variantId) throw new Error("Variant does not match pricing context");

  const lines: QuoteLine[] = [
    { code: "base", label: context.productName, amount: assertMoney(context.basePrice), kind: "BASE" },
  ];

  if (context.variantModifier > 0) {
    lines.push({ code: "variant", label: "Ajuste de variante", amount: assertMoney(context.variantModifier), kind: "VARIANT" });
  }

  const techniqueModifier = context.techniqueModifiers[request.technique] ?? 0;
  if (techniqueModifier > 0) {
    lines.push({ code: `technique:${request.technique}`, label: `Técnica ${request.technique}`, amount: assertMoney(techniqueModifier), kind: "TECHNIQUE" });
  }

  for (const area of request.areas) {
    const amount = context.areaPrices[area.areaKey]?.[area.size];
    if (amount === undefined) throw new Error(`Unsupported print area or size: ${area.areaKey}/${area.size}`);
    lines.push({ code: `area:${area.areaKey}:${area.size}`, label: `Impresión ${area.areaKey.toLocaleLowerCase("es")} (${area.size.toLocaleLowerCase("es")})`, amount: assertMoney(amount), kind: "PRINT_AREA" });
    if (area.hasPersonalizedText) {
      lines.push({ code: `text:${area.areaKey}`, label: "Texto personalizado", amount: assertMoney(context.personalizedTextPrice), kind: "EXTRA" });
    }
  }

  const unitSubtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const tier = [...context.volumeTiers]
    .sort((a, b) => b.minimum - a.minimum)
    .find((candidate) => request.quantity >= candidate.minimum);
  const discountPercent = tier?.discountPercent ?? 0;
  const undiscounted = unitSubtotal * request.quantity;
  const discountTotal = Math.round((undiscounted * discountPercent) / 100);
  const total = undiscounted - discountTotal;
  const unitPrice = Math.round(total / request.quantity);

  if (discountTotal > 0) {
    lines.push({ code: `volume:${tier?.minimum}`, label: `Descuento por volumen (${discountPercent}%)`, amount: -discountTotal, kind: "DISCOUNT" });
  }

  return {
    currency: "COP",
    quantity: request.quantity,
    unitSubtotal,
    discountPercent,
    unitPrice,
    subtotal: undiscounted,
    discountTotal,
    total,
    lines,
    fingerprint: [context.productId, context.variantId, request.quantity, request.technique, ...request.areas.map((area) => `${area.areaKey}:${area.size}:${area.hasPersonalizedText ? 1 : 0}`)].join("|"),
  };
}
