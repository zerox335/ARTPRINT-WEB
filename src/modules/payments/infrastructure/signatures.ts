import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function constantTimeHexEqual(received: string, expected: string): boolean {
  if (!/^[a-f0-9]+$/i.test(received) || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}

function readPath(value: unknown, path: string): unknown {
  const normalized = path.startsWith("data.") ? path.slice(5) : path;
  return normalized.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, value);
}

export function wompiEventChecksum(body: unknown, eventsSecret: string): string {
  if (!body || typeof body !== "object") throw new Error("Invalid Wompi body");
  const event = body as Record<string, unknown>;
  const signature = event.signature as { properties?: unknown; checksum?: unknown } | undefined;
  if (!signature || !Array.isArray(signature.properties) || typeof event.timestamp !== "number") {
    throw new Error("Invalid Wompi signature structure");
  }
  const data = event.data;
  const values = signature.properties.map((property) => {
    if (typeof property !== "string") throw new Error("Invalid Wompi signature property");
    const value = readPath(data, property);
    if (["string", "number", "boolean"].includes(typeof value)) return String(value);
    throw new Error(`Missing signed property: ${property}`);
  });
  return createHash("sha256").update(`${values.join("")}${event.timestamp}${eventsSecret}`, "utf8").digest("hex");
}

export function verifyWompiEvent(body: unknown, eventsSecret: string, headerChecksum?: string | null): boolean {
  if (!body || typeof body !== "object") return false;
  const signature = (body as Record<string, unknown>).signature as { checksum?: unknown } | undefined;
  const received = headerChecksum || (typeof signature?.checksum === "string" ? signature.checksum : "");
  try {
    return constantTimeHexEqual(received.toLowerCase(), wompiEventChecksum(body, eventsSecret));
  } catch {
    return false;
  }
}

export function wompiIntegritySignature(reference: string, amountInCents: number, secret: string): string {
  return createHash("sha256").update(`${reference}${amountInCents}COP${secret}`, "utf8").digest("hex");
}

export function verifyMercadoPagoSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!input.xSignature || !input.xRequestId || !input.dataId) return false;
  const parts = Object.fromEntries(
    input.xSignature.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received) return false;
  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", input.secret).update(manifest).digest("hex");
  return constantTimeHexEqual(received.toLowerCase(), expected);
}
