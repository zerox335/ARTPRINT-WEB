import type { CartLine } from "@/src/modules/cart/domain/cart";

export const FREE_SHIPPING_MINIMUM = 150_000;
export const STANDARD_SHIPPING_TOTAL = 9_000;
export type DeliveryMethod = "SHIPPING" | "PICKUP";

export function shippingTotalForMerchandise(merchandiseTotal: number, method: DeliveryMethod = "SHIPPING"): number {
  if (method === "PICKUP") return 0;
  return merchandiseTotal >= FREE_SHIPPING_MINIMUM ? 0 : STANDARD_SHIPPING_TOTAL;
}

export function checkoutItemsFromCart(lines: readonly CartLine[]) {
  return lines.map((line) => ({
    variantId: line.variant.id,
    quantity: line.quantity,
    technique: line.technique,
    areas: line.areas,
    customization: line.customization,
  }));
}
