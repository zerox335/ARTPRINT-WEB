import { NextResponse } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma";
import { objectStorage } from "@/src/modules/files/infrastructure/storage";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const asset = await prisma.uploadedAsset.findFirst({ where: { id, status: "READY" } });
  if (!asset) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const object = await objectStorage().get(asset.storageKey);
  if (!object) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return new NextResponse(object.bytes as BodyInit, {
    headers: { "Content-Type": object.contentType, "Content-Disposition": "inline", "Cache-Control": "private, max-age=3600", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" },
  });
}
