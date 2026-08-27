import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { env } from "@/src/shared/env";

export function apiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Revisa los datos enviados", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 400 });
  }
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "UNAUTHENTICATED", message: "Inicia sesión para continuar" }, { status: 401 });
  if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN", message: "No tienes permiso para realizar esta acción" }, { status: 403 });
  if (error instanceof Error && error.message === "RATE_LIMITED") return NextResponse.json({ error: "RATE_LIMITED", message: "Has cargado muchas imágenes. Espera un momento e inténtalo de nuevo" }, { status: 429 });
  console.error("Unhandled API error", error instanceof Error ? { name: error.name, message: error.message } : { error: "unknown" });
  return NextResponse.json({ error: "INTERNAL_ERROR", message: "No pudimos completar la solicitud" }, { status: 500 });
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  if (origin !== allowed) throw new Error("FORBIDDEN");
}

const rateBuckets = new Map<string, { hits: number; resetAt: number }>();

export function assertRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { hits: 1, resetAt: now + windowMs });
    return;
  }
  bucket.hits += 1;
  if (bucket.hits > limit) throw new Error("RATE_LIMITED");
}

export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded ?? request.headers.get("x-real-ip") ?? "local";
}
