import type { WebhookInput } from "@/src/modules/payments/domain/payment-provider";

const mocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  findPayment: vi.fn(),
  transaction: vi.fn(),
  paymentEventCreate: vi.fn(),
  paymentUpdate: vi.fn(),
  orderUpdate: vi.fn(),
  historyCreate: vi.fn(),
  businessEventCreate: vi.fn(),
}));

vi.mock("@/src/modules/payments/infrastructure/providers", () => ({
  paymentProvider: () => ({ name: "sandbox", verifyWebhook: mocks.verifyWebhook }),
}));

vi.mock("@/src/infrastructure/database/prisma", () => ({
  prisma: {
    payment: { findFirst: mocks.findPayment },
    $transaction: mocks.transaction,
  },
}));

import { processPaymentWebhook } from "@/src/modules/payments/application/process-webhook";

const webhookInput: WebhookInput = {
  body: {},
  rawBody: "{}",
  headers: new Headers(),
  query: new URLSearchParams(),
};

describe("payment webhook processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (work) => work({
      paymentEvent: { create: mocks.paymentEventCreate },
      payment: { update: mocks.paymentUpdate },
      order: { update: mocks.orderUpdate },
      orderStatusHistory: { create: mocks.historyCreate },
      businessEvent: { create: mocks.businessEventCreate },
    }));
  });

  it("rejects an event with an invalid provider signature before database writes", async () => {
    mocks.verifyWebhook.mockResolvedValue({
      valid: false,
      eventId: "event-invalid",
      eventType: "payment.updated",
      raw: {},
    });

    await expect(processPaymentWebhook("sandbox", webhookInput)).resolves.toEqual({
      accepted: false,
      reason: "INVALID_SIGNATURE",
    });
    expect(mocks.findPayment).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("marks the order paid only after an authentic approved event", async () => {
    mocks.verifyWebhook.mockResolvedValue({
      valid: true,
      eventId: "event-approved",
      eventType: "payment.updated",
      providerPaymentId: "provider-payment",
      reference: "AP-REFERENCE",
      status: "APPROVED",
      raw: { status: "APPROVED" },
    });
    mocks.findPayment.mockResolvedValue({
      id: "payment",
      orderId: "order",
      providerPaymentId: null,
      amount: 42_000,
      order: { status: "PENDING_PAYMENT", userId: "customer" },
    });

    await expect(processPaymentWebhook("sandbox", webhookInput)).resolves.toEqual({
      accepted: true,
      duplicate: false,
      paymentFound: true,
    });
    expect(mocks.paymentEventCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerEventId: "event-approved", signatureValid: true }),
    }));
    expect(mocks.paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "APPROVED", providerPaymentId: "provider-payment" }),
    }));
    expect(mocks.orderUpdate).toHaveBeenCalledWith({ where: { id: "order" }, data: { status: "PAID" } });
    expect(mocks.historyCreate).toHaveBeenCalled();
    expect(mocks.businessEventCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: "payment_approved" }),
    }));
  });

  it("records a failed payment without moving the order to paid", async () => {
    mocks.verifyWebhook.mockResolvedValue({
      valid: true,
      eventId: "event-declined",
      eventType: "payment.updated",
      reference: "AP-REFERENCE",
      status: "DECLINED",
      raw: { status: "DECLINED" },
    });
    mocks.findPayment.mockResolvedValue({
      id: "payment",
      orderId: "order",
      providerPaymentId: null,
      amount: 42_000,
      order: { status: "PENDING_PAYMENT", userId: "customer" },
    });

    await processPaymentWebhook("sandbox", webhookInput);
    expect(mocks.orderUpdate).not.toHaveBeenCalled();
    expect(mocks.businessEventCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: "payment_failed" }),
    }));
  });
});
