import { describe, expect, it } from "vitest";
import { resizeVisualRect } from "@/src/modules/admin/domain/visual-calibration";

describe("visual mockup calibration", () => {
  it("moves a rectangle without letting it leave the mockup", () => {
    expect(resizeVisualRect({ x: 18, y: 7, width: 64, height: 86 }, "move", 50, 50)).toEqual({ x: 36, y: 14, width: 64, height: 86 });
  });

  it("resizes from any corner and keeps a minimum visible rectangle", () => {
    expect(resizeVisualRect({ x: 20, y: 10, width: 25, height: 22 }, "nw", -5, -4)).toEqual({ x: 15, y: 6, width: 30, height: 26 });
    expect(resizeVisualRect({ x: 20, y: 10, width: 25, height: 22 }, "se", -100, -100)).toEqual({ x: 20, y: 10, width: 2, height: 2 });
  });
});
