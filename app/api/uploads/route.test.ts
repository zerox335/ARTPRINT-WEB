import sharp from "sharp";
import { NextRequest } from "next/server";

const { databaseCreate, storagePut, findCurrentUser } = vi.hoisted(() => ({
  databaseCreate: vi.fn(),
  storagePut: vi.fn(),
  findCurrentUser: vi.fn(),
}));

vi.mock("@/src/infrastructure/database/prisma", () => ({
  prisma: { uploadedAsset: { create: databaseCreate } },
}));
vi.mock("@/src/modules/files/infrastructure/storage", () => ({
  objectStorage: () => ({ put: storagePut }),
}));
vi.mock("@/src/modules/identity/infrastructure/session", () => ({
  currentUser: findCurrentUser,
}));

import { POST } from "@/app/api/uploads/route";

describe("POST /api/uploads in demo mode", () => {
  it("validates an image and returns preview metadata without a database", async () => {
    const bytes = await sharp({ create: { width: 80, height: 50, channels: 4, background: "#f45b98" } }).webp().toBuffer();
    const form = new FormData();
    form.set("file", new File([Uint8Array.from(bytes)], "diseno.webp", { type: "image/webp" }));

    const response = await POST(new NextRequest("http://localhost:3000/api/uploads", { method: "POST", body: form }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.asset).toMatchObject({ mimeType: "image/webp", width: 80, height: 50 });
    expect(body.asset.id).toMatch(/^demo-/);
    expect(databaseCreate).not.toHaveBeenCalled();
    expect(storagePut).not.toHaveBeenCalled();
    expect(findCurrentUser).not.toHaveBeenCalled();
  });
});
