import { NextResponse } from "next/server";
import { processPaymentWebhook } from "@/src/modules/payments/application/process-webhook";
import type { PaymentProviderName } from "@/src/modules/payments/domain/payment-provider";
import { apiError } from "@/src/shared/http";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await context.params;
    if (!(["wompi", "mercadopago", "sandbox"] as string[]).includes(provider)) return NextResponse.json({ error: "UNKNOWN_PROVIDER" }, { status: 404 });
    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as unknown;
    const result = await processPaymentWebhook(provider as PaymentProviderName, { body, rawBody, headers: request.headers, query: new URL(request.url).searchParams });
    if (!result.accepted) return NextResponse.json({ error: result.reason }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
