import { createHmac, randomUUID } from "node:crypto";
import type {
  CheckoutSession,
  CreateCheckoutInput,
  NormalizedPaymentStatus,
  PaymentProvider,
  VerifiedPaymentEvent,
  WebhookInput,
} from "@/src/modules/payments/domain/payment-provider";
import {
  verifyMercadoPagoSignature,
  verifyWompiEvent,
  wompiIntegritySignature,
} from "@/src/modules/payments/infrastructure/signatures";
import { env } from "@/src/shared/env";
import { toProviderMinorUnits } from "@/src/shared/money";

function mapWompiStatus(status: unknown): NormalizedPaymentStatus {
  if (status === "APPROVED") return "APPROVED";
  if (status === "DECLINED") return "DECLINED";
  if (status === "VOIDED") return "VOIDED";
  if (status === "ERROR") return "ERROR";
  return "PENDING";
}

function mapMercadoPagoStatus(status: unknown): NormalizedPaymentStatus {
  if (status === "approved") return "APPROVED";
  if (["rejected", "cancelled"].includes(String(status))) return "DECLINED";
  if (status === "refunded" || status === "charged_back") return "VOIDED";
  return "PENDING";
}

export class SandboxPaymentProvider implements PaymentProvider {
  readonly name = "sandbox" as const;

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    if (env.NODE_ENV === "production") throw new Error("Sandbox payments are disabled in production");
    return {
      provider: this.name,
      providerPaymentId: `sandbox_${randomUUID()}`,
      reference: input.reference,
      checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/pago/sandbox?reference=${encodeURIComponent(input.reference)}`,
      status: "PENDING",
      raw: { sandbox: true, amount: input.amountCop },
    };
  }

  async verifyWebhook(input: WebhookInput): Promise<VerifiedPaymentEvent> {
    const signature = input.headers.get("x-sandbox-signature") ?? "";
    const secret = env.SESSION_SECRET ?? "development-only-sandbox-secret";
    const expected = createHmac("sha256", secret).update(input.rawBody).digest("hex");
    const body = input.body as Record<string, unknown>;
    return {
      valid: signature === expected && env.NODE_ENV !== "production",
      eventId: String(body.eventId ?? randomUUID()),
      eventType: "sandbox.payment.updated",
      providerPaymentId: typeof body.paymentId === "string" ? body.paymentId : undefined,
      reference: typeof body.reference === "string" ? body.reference : undefined,
      status: mapWompiStatus(body.status),
      raw: input.body,
    };
  }
}

export class WompiPaymentProvider implements PaymentProvider {
  readonly name = "wompi" as const;

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    if (!env.WOMPI_PUBLIC_KEY || !env.WOMPI_INTEGRITY_SECRET) {
      throw new Error("Wompi credentials are not configured");
    }
    const amountInCents = toProviderMinorUnits(input.amountCop);
    const integrity = wompiIntegritySignature(input.reference, amountInCents, env.WOMPI_INTEGRITY_SECRET);
    const query = new URLSearchParams({
      "public-key": env.WOMPI_PUBLIC_KEY,
      currency: "COP",
      "amount-in-cents": String(amountInCents),
      reference: input.reference,
      "signature:integrity": integrity,
      "redirect-url": input.returnUrl,
      "customer-data:email": input.customerEmail,
    });
    return {
      provider: this.name,
      reference: input.reference,
      checkoutUrl: `https://checkout.wompi.co/p/?${query.toString()}`,
      status: "PENDING",
      raw: { environment: env.WOMPI_ENVIRONMENT, amountInCents },
    };
  }

  async verifyWebhook(input: WebhookInput): Promise<VerifiedPaymentEvent> {
    const body = input.body as Record<string, unknown>;
    const transaction = (body.data as { transaction?: Record<string, unknown> } | undefined)?.transaction;
    const valid = Boolean(env.WOMPI_EVENTS_SECRET) && verifyWompiEvent(body, env.WOMPI_EVENTS_SECRET ?? "", input.headers.get("x-event-checksum"));
    return {
      valid,
      eventId: `${String(body.event ?? "unknown")}:${String(transaction?.id ?? body.timestamp ?? "unknown")}:${String(body.timestamp ?? "")}`,
      eventType: String(body.event ?? "unknown"),
      providerPaymentId: typeof transaction?.id === "string" ? transaction.id : undefined,
      reference: typeof transaction?.reference === "string" ? transaction.reference : undefined,
      status: mapWompiStatus(transaction?.status),
      raw: input.body,
    };
  }
}

export class MercadoPagoPaymentProvider implements PaymentProvider {
  readonly name = "mercadopago" as const;

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) throw new Error("Mercado Pago credentials are not configured");
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": input.reference,
      },
      body: JSON.stringify({
        external_reference: input.reference,
        items: [{ id: input.orderId, title: input.description, quantity: 1, currency_id: "COP", unit_price: input.amountCop }],
        payer: { email: input.customerEmail },
        back_urls: { success: input.returnUrl, failure: input.returnUrl, pending: input.returnUrl },
        notification_url: input.webhookUrl,
        auto_return: "approved",
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Mercado Pago preference failed (${response.status})`);
    const data = (await response.json()) as { id: string; init_point: string; sandbox_init_point?: string };
    return {
      provider: this.name,
      providerPaymentId: data.id,
      reference: input.reference,
      checkoutUrl: data.init_point,
      status: "PENDING",
      raw: { preferenceId: data.id },
    };
  }

  async verifyWebhook(input: WebhookInput): Promise<VerifiedPaymentEvent> {
    const body = input.body as { id?: string | number; action?: string; type?: string; data?: { id?: string | number } };
    const dataId = input.query.get("data.id") ?? (body.data?.id ? String(body.data.id) : null);
    const valid = Boolean(env.MERCADOPAGO_WEBHOOK_SECRET) && verifyMercadoPagoSignature({
      xSignature: input.headers.get("x-signature"),
      xRequestId: input.headers.get("x-request-id"),
      dataId,
      secret: env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
    });
    let payment: { id?: string | number; status?: string; external_reference?: string } = {};
    if (valid && dataId && env.MERCADOPAGO_ACCESS_TOKEN) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
        headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
        cache: "no-store",
      });
      if (response.ok) payment = (await response.json()) as typeof payment;
    }
    return {
      valid,
      eventId: String(body.id ?? `${body.action ?? "payment"}:${dataId ?? "unknown"}`),
      eventType: body.action ?? body.type ?? "payment.updated",
      providerPaymentId: payment.id ? String(payment.id) : dataId ?? undefined,
      reference: payment.external_reference,
      status: valid ? mapMercadoPagoStatus(payment.status) : undefined,
      raw: input.body,
    };
  }
}

export function paymentProvider(name = env.PAYMENT_PROVIDER): PaymentProvider {
  if (name === "wompi") return new WompiPaymentProvider();
  if (name === "mercadopago") return new MercadoPagoPaymentProvider();
  return new SandboxPaymentProvider();
}
