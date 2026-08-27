export type PaymentProviderName = "sandbox" | "wompi" | "mercadopago";
export type NormalizedPaymentStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export type CreateCheckoutInput = {
  orderId: string;
  orderNumber: string;
  reference: string;
  amountCop: number;
  customerEmail: string;
  description: string;
  returnUrl: string;
  webhookUrl: string;
};

export type CheckoutSession = {
  provider: PaymentProviderName;
  providerPaymentId?: string;
  reference: string;
  checkoutUrl: string;
  status: NormalizedPaymentStatus;
  raw: Record<string, unknown>;
};

export type WebhookInput = {
  body: unknown;
  rawBody: string;
  headers: Headers;
  query: URLSearchParams;
};

export type VerifiedPaymentEvent = {
  valid: boolean;
  eventId: string;
  eventType: string;
  providerPaymentId?: string;
  reference?: string;
  status?: NormalizedPaymentStatus;
  raw: unknown;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  verifyWebhook(input: WebhookInput): Promise<VerifiedPaymentEvent>;
}
