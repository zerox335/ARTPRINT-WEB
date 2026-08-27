export type VisualRect = { x: number; y: number; width: number; height: number };
export type VisualResizeMode = "move" | "nw" | "ne" | "sw" | "se";

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const tidy = (value: number) => Math.round(value * 10) / 10;

export function resizeVisualRect(rect: VisualRect, mode: VisualResizeMode, dx: number, dy: number): VisualRect {
  if (mode === "move") return { ...rect, x: tidy(clamp(rect.x + dx, 0, 100 - rect.width)), y: tidy(clamp(rect.y + dy, 0, 100 - rect.height)) };
  const minimum = 2;
  const originalRight = rect.x + rect.width;
  const originalBottom = rect.y + rect.height;
  const left = mode.includes("w") ? clamp(rect.x + dx, 0, originalRight - minimum) : rect.x;
  const top = mode.includes("n") ? clamp(rect.y + dy, 0, originalBottom - minimum) : rect.y;
  const right = mode.includes("e") ? clamp(originalRight + dx, left + minimum, 100) : originalRight;
  const bottom = mode.includes("s") ? clamp(originalBottom + dy, top + minimum, 100) : originalBottom;
  return { x: tidy(left), y: tidy(top), width: tidy(right - left), height: tidy(bottom - top) };
}
