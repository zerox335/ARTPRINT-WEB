export type CurrencyCode = "COP";

export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type Result<T, E extends string = string> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string };

export type UserRole =
  | "CUSTOMER"
  | "ADMIN"
  | "DESIGNER"
  | "PRODUCTION"
  | "CUSTOMER_SUPPORT";
