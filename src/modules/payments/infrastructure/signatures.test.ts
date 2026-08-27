import { createHash, createHmac } from "node:crypto";
import {
  verifyMercadoPagoSignature,
  verifyWompiEvent,
  wompiIntegritySignature,
} from "@/src/modules/payments/infrastructure/signatures";

describe("payment signatures", () => {
  it("generates the documented Wompi integrity SHA-256", () => {
    expect(
      wompiIntegritySignature("sk8-438k4-xmxm392-sn2m", 2490000, "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6"),
    ).toBe("37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5");
  });

  it("verifies a Wompi webhook and rejects tampering", () => {
    const secret = "test_events_secret";
    const body = {
      event: "transaction.updated",
      data: { transaction: { id: "tx-1", status: "APPROVED", reference: "AP-1" } },
      timestamp: 1720000000,
      signature: { properties: ["transaction.id", "transaction.status", "transaction.reference"], checksum: "" },
    };
    body.signature.checksum = createHash("sha256").update(`tx-1APPROVEDAP-11720000000${secret}`).digest("hex");
    expect(verifyWompiEvent(body, secret)).toBe(true);
    body.data.transaction.status = "DECLINED";
    expect(verifyWompiEvent(body, secret)).toBe(false);
  });

  it("verifies Mercado Pago HMAC and rejects a different data id", () => {
    const secret = "mp-secret";
    const ts = "1704908010";
    const requestId = "request-123";
    const dataId = "999999999";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    const input = { xSignature: `ts=${ts},v1=${v1}`, xRequestId: requestId, dataId, secret };
    expect(verifyMercadoPagoSignature(input)).toBe(true);
    expect(verifyMercadoPagoSignature({ ...input, dataId: "other" })).toBe(false);
  });
});
