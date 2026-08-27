import { cylindricalProjection } from "@/src/modules/customization/domain/cylindrical-projection";

describe("cylindrical image projection", () => {
  it("keeps the complete source image while compressing its lateral edges", () => {
    const strips = cylindricalProjection(2000, 320, 180, 40);
    const first = strips[0]!;
    const center = strips[Math.floor(strips.length / 2)]!;
    const last = strips.at(-1)!;

    expect(strips).toHaveLength(40);
    expect(first.sourceX).toBe(0);
    expect(last.sourceX + last.sourceWidth).toBeCloseTo(2000);
    expect(first.x).toBeCloseTo(0);
    expect(last.x + last.width).toBeCloseTo(320);
    expect(first.width).toBeLessThan(center.width);
    expect(first.y).toBeGreaterThan(center.y);
    expect(first.height).toBeLessThan(center.height);
  });
});
