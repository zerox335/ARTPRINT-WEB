import type { CustomizationSpec } from "@/src/modules/customization/domain/customization";
import type { PriceQuote, QuoteRequest } from "@/src/modules/pricing/domain/price-engine";

export type CartLine = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  variant: { id: string; name: string; sku: string };
  quantity: number;
  technique: string;
  areas: QuoteRequest["areas"];
  customization?: CustomizationSpec;
  quote: PriceQuote;
};

export function cartTotals(lines: readonly CartLine[]) {
  return {
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + line.quote.total, 0),
  };
}

export function appendCartLine(lines: readonly CartLine[], line: Omit<CartLine, "id">, id: string): CartLine[] {
  return [...lines, { ...line, id }];
}

export function removeCartLine(lines: readonly CartLine[], id: string): CartLine[] {
  return lines.filter((line) => line.id !== id);
}

export function replaceCartLine(lines: readonly CartLine[], id: string, replacement: CartLine): CartLine[] {
  return lines.map((line) => (line.id === id ? replacement : line));
}
