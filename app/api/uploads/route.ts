import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import { UploadValidationError, validateUploadedImage } from "@/src/modules/files/domain/file-validation";
import { objectStorage } from "@/src/modules/files/infrastructure/storage";
import { currentUser } from "@/src/modules/identity/infrastructure/session";
import { env } from "@/src/shared/env";
import { apiError, assertRateLimit, assertSameOrigin, clientKey } from "@/src/shared/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertRateLimit(`upload:${clientKey(request)}`, env.DEMO_MODE === "true" || !env.DATABASE_URL ? 200 : 60, 60 * 60 * 1000);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED", message: "Selecciona una imagen" }, { status: 400 });
    const validated = await validateUploadedImage(file);

    // The local demo intentionally runs without PostgreSQL. The editor renders
    // the selected file from the browser, so a validated temporary identifier is
    // enough to preview the design without persisting customer uploads.
    if (env.DEMO_MODE === "true" || !env.DATABASE_URL) {
      return NextResponse.json({
        asset: {
          id: `demo-${validated.sha256.slice(0, 24)}-${randomUUID()}`,
          url: "",
          mimeType: validated.mimeType,
          width: validated.widthPx,
          height: validated.heightPx,
        },
      }, { status: 201 });
    }

    const user = await currentUser();
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
