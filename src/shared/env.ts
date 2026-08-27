import { z } from "zod";

const emptyToUndefined = (value: unknown) => value === "" ? undefined : value;
const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: optionalUrl,
  SESSION_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  SESSION_COOKIE_NAME: z.string().default("artprint_session"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().regex(/^\d{10,15}$/).default("573001234567"),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
  PAYMENT_PROVIDER: z.enum(["sandbox", "wompi", "mercadopago"]).default("sandbox"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_PATH: z.string().default(".data/uploads"),
  WOMPI_PUBLIC_KEY: optionalString,
  WOMPI_INTEGRITY_SECRET: optionalString,
  WOMPI_EVENTS_SECRET: optionalString,
  WOMPI_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  MERCADOPAGO_ACCESS_TOKEN: optionalString,
  MERCADOPAGO_WEBHOOK_SECRET: optionalString,
  S3_ENDPOINT: optionalUrl,
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("true"),
});

export const env = envSchema.parse(process.env);

export function assertProductionEnv(): void {
  if (env.NODE_ENV !== "production") return;
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required in production");
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET is required in production");
  if (env.PAYMENT_PROVIDER === "sandbox") {
    throw new Error("Sandbox payments cannot be enabled in production");
  }
}
