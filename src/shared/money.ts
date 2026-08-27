import type { CurrencyCode } from "@/src/shared/types";

export const CURRENCY: CurrencyCode = "COP";

export function assertMoney(value: number, field = "amount"): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toProviderMinorUnits(amountCop: number): number {
  return assertMoney(amountCop) * 100;
}
