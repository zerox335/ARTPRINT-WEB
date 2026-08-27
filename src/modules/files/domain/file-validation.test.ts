import { validateUploadedImage } from "@/src/modules/files/domain/file-validation";
import sharp from "sharp";

describe("secure image upload validation", () => {
  it("rejects SVG with executable content", async () => {
    const file = new File([`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`], "attack.svg", { type: "image/svg+xml" });
    await expect(validateUploadedImage(file)).rejects.toThrow("contenido no permitido");
  });

  it("rejects mismatched extensions and magic bytes", async () => {
    const file = new File(["not an image"], "fake.png", { type: "image/png" });
    await expect(validateUploadedImage(file)).rejects.toThrow("no coincide");
  });

  it("accepts a real WEBP mockup and canonicalizes its metadata", async () => {
    const bytes = await sharp({ create: { width: 40, height: 60, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).webp().toBuffer();
    const file = new File([Uint8Array.from(bytes)], "case.webp", { type: "image/webp" });
    await expect(validateUploadedImage(file)).resolves.toMatchObject({ extension: ".webp", mimeType: "image/webp", widthPx: 40, heightPx: 60 });
  });
});
