import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import { UploadValidationError, validateUploadedImage } from "@/src/modules/files/domain/file-validation";
import { objectStorage } from "@/src/modules/files/infrastructure/storage";
import { currentUser } from "@/src/modules/identity/infrastructure/session";
import { apiError, assertRateLimit, assertSameOrigin, clientKey } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertRateLimit(`upload:${clientKey(request)}`, 20, 60 * 60 * 1000);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED", message: "Selecciona una imagen" }, { status: 400 });
    const [validated, user] = await Promise.all([validateUploadedImage(file), currentUser()]);
    const key = `originals/${validated.sha256.slice(0, 2)}/${validated.sha256}-${randomUUID()}${validated.extension}`;
    await objectStorage().put({ key, bytes: validated.bytes, contentType: validated.mimeType, metadata: { sha256: validated.sha256 } });
    const asset = await prisma.uploadedAsset.create({
      data: { userId: user?.id, storageKey: key, originalName: file.name.slice(0, 255), mimeType: validated.mimeType, sizeBytes: validated.sizeBytes, widthPx: validated.widthPx, heightPx: validated.heightPx, sha256: validated.sha256, status: "READY" },
    });
    return NextResponse.json({ asset: { id: asset.id, url: `/api/uploads/${asset.id}`, mimeType: asset.mimeType, width: asset.widthPx, height: asset.heightPx } }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) return NextResponse.json({ error: "INVALID_IMAGE", message: error.message }, { status: 400 });
    return apiError(error);
  }
}
