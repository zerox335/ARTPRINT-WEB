import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

export class UploadValidationError extends Error {}

export type ValidatedUpload = {
  bytes: Buffer;
  extension: ".png" | ".jpg" | ".webp" | ".svg";
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
  sizeBytes: number;
  widthPx?: number;
  heightPx?: number;
  sha256: string;
};

function isPng(bytes: Buffer): boolean {
  return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function isJpeg(bytes: Buffer): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Buffer): boolean {
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

function validateSvg(bytes: Buffer): void {
  const source = bytes.toString("utf8");
  if (!/^\s*<svg[\s>]/i.test(source)) throw new UploadValidationError("El archivo no es un SVG válido");
  const dangerous = /<script|<foreignObject|<!DOCTYPE|<!ENTITY|\son\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:|javascript:)/i;
  if (dangerous.test(source)) throw new UploadValidationError("El SVG contiene contenido no permitido");
}

export async function validateUploadedImage(file: File): Promise<ValidatedUpload> {
  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.has(extension)) throw new UploadValidationError("Formato no permitido. Usa PNG, JPG, WEBP o SVG seguro");
  if (file.size < 1 || file.size > MAX_FILE_BYTES) throw new UploadValidationError("El archivo debe pesar entre 1 byte y 12 MB");
  const bytes = Buffer.from(await file.arrayBuffer());

  let mimeType: ValidatedUpload["mimeType"];
  let normalizedExtension: ValidatedUpload["extension"];

  if (isPng(bytes) && file.type === "image/png" && extension === ".png") {
    mimeType = "image/png";
    normalizedExtension = ".png";
  } else if (isJpeg(bytes) && file.type === "image/jpeg" && (extension === ".jpg" || extension === ".jpeg")) {
    mimeType = "image/jpeg";
    normalizedExtension = ".jpg";
  } else if (isWebp(bytes) && file.type === "image/webp" && extension === ".webp") {
    mimeType = "image/webp";
    normalizedExtension = ".webp";
  } else if (file.type === "image/svg+xml" || extension === ".svg") {
    validateSvg(bytes);
    mimeType = "image/svg+xml";
    normalizedExtension = ".svg";
  } else {
    throw new UploadValidationError("El contenido no coincide con el tipo de archivo declarado");
  }

  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  const widthPx = metadata.width;
  const heightPx = metadata.height;
  if (!widthPx || !heightPx || widthPx > 12000 || heightPx > 12000) {
    throw new UploadValidationError("La imagen tiene dimensiones inválidas o excede 12000 × 12000 px");
  }

  return {
    bytes,
    extension: normalizedExtension,
    mimeType,
    sizeBytes: bytes.length,
    widthPx,
    heightPx,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
