import { describe, expect, it } from "vitest";
import { caseReferenceActivationSchema } from "@/src/modules/admin/domain/case-reference-activation";

const valid = { assetId: "asset-1", widthPx: 800, heightPx: 1200, area: { name: "Área posterior", x: 15, y: 5, width: 70, height: 90, realWidthCm: 7.2, realHeightCm: 15.2 }, exclusion: { name: "Cámara", x: 18, y: 7, width: 25, height: 20, radius: 8 } };

describe("caseReferenceActivationSchema", () => {
  it("accepts a calibrated case template", () => expect(caseReferenceActivationSchema.safeParse(valid).success).toBe(true));
  it("rejects an area outside the mockup", () => expect(caseReferenceActivationSchema.safeParse({ ...valid, area: { ...valid.area, x: 60, width: 50 } }).success).toBe(false));
  it("rejects an exclusion outside the mockup", () => expect(caseReferenceActivationSchema.safeParse({ ...valid, exclusion: { ...valid.exclusion, y: 90, height: 20 } }).success).toBe(false));
});
