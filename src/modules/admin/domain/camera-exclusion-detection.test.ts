import { describe, expect, it } from "vitest";
import { detectCameraExclusionFromAlpha } from "@/src/modules/admin/domain/camera-exclusion-detection";

function caseAlpha(width = 100, height = 180) {
  const alpha = new Uint8Array(width * height);
  for (let y = 5; y < 175; y += 1) for (let x = 15; x < 85; x += 1) alpha[y * width + x] = 255;
  for (let y = 15; y < 48; y += 1) for (let x = 23; x < 48; x += 1) alpha[y * width + x] = 0;
  return alpha;
}

describe("camera exclusion detection", () => {
  it("finds an internal transparent camera opening near the top", () => {
    const result = detectCameraExclusionFromAlpha(100, 180, caseAlpha());
    expect(result).not.toBeNull();
    expect(result!.x).toBeLessThan(25);
    expect(result!.y).toBeLessThan(15);
    expect(result!.width).toBeGreaterThan(20);
  });
  it("does not invent a camera when the case has no transparent opening", () => {
    const alpha = new Uint8Array(100 * 180).fill(255);
    expect(detectCameraExclusionFromAlpha(100, 180, alpha)).toBeNull();
  });
});
