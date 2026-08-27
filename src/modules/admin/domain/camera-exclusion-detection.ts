export type DetectedExclusion = { x: number; y: number; width: number; height: number; confidence: "HIGH" | "MEDIUM" };

type Component = { minX: number; minY: number; maxX: number; maxY: number; pixels: number; touchesEdge: boolean };

export function detectCameraExclusionFromAlpha(width: number, height: number, alpha: ArrayLike<number>): DetectedExclusion | null {
  if (width < 20 || height < 20 || alpha.length !== width * height) return null;
  let opaqueMinX = width; let opaqueMinY = height; let opaqueMaxX = -1; let opaqueMaxY = -1;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (alpha[y * width + x]! >= 96) { opaqueMinX = Math.min(opaqueMinX, x); opaqueMinY = Math.min(opaqueMinY, y); opaqueMaxX = Math.max(opaqueMaxX, x); opaqueMaxY = Math.max(opaqueMaxY, y); }
  }
  if (opaqueMaxX <= opaqueMinX || opaqueMaxY <= opaqueMinY) return null;

  const visited = new Uint8Array(width * height);
  const components: Component[] = [];
  const bboxWidth = opaqueMaxX - opaqueMinX + 1;
  const bboxHeight = opaqueMaxY - opaqueMinY + 1;
  const minimumPixels = Math.max(12, Math.round(bboxWidth * bboxHeight * .0015));
  for (let startY = opaqueMinY; startY <= opaqueMaxY; startY += 1) for (let startX = opaqueMinX; startX <= opaqueMaxX; startX += 1) {
    const startIndex = startY * width + startX;
    if (visited[startIndex] || alpha[startIndex]! >= 48) continue;
    const queue = [startIndex];
    visited[startIndex] = 1;
    const component: Component = { minX: startX, minY: startY, maxX: startX, maxY: startY, pixels: 0, touchesEdge: false };
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]!; const x = index % width; const y = Math.floor(index / width);
      component.pixels += 1; component.minX = Math.min(component.minX, x); component.minY = Math.min(component.minY, y); component.maxX = Math.max(component.maxX, x); component.maxY = Math.max(component.maxY, y);
      if (x === opaqueMinX || x === opaqueMaxX || y === opaqueMinY || y === opaqueMaxY) component.touchesEdge = true;
      const neighbors: Array<[number, number]> = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (const [nextX, nextY] of neighbors) {
        if (nextX < opaqueMinX || nextX > opaqueMaxX || nextY < opaqueMinY || nextY > opaqueMaxY) continue;
        const nextIndex = nextY * width + nextX;
        if (!visited[nextIndex] && alpha[nextIndex]! < 48) { visited[nextIndex] = 1; queue.push(nextIndex); }
      }
    }
    const centerY = (component.minY + component.maxY) / 2;
    if (!component.touchesEdge && component.pixels >= minimumPixels && centerY <= opaqueMinY + bboxHeight * .48 && component.pixels <= bboxWidth * bboxHeight * .28) components.push(component);
  }
  const camera = components.sort((a, b) => b.pixels - a.pixels)[0];
  if (!camera) return null;
  const paddingX = Math.max(2, Math.round(bboxWidth * .012));
  const paddingY = Math.max(2, Math.round(bboxHeight * .012));
  const minX = Math.max(0, camera.minX - paddingX); const minY = Math.max(0, camera.minY - paddingY);
  const maxX = Math.min(width - 1, camera.maxX + paddingX); const maxY = Math.min(height - 1, camera.maxY + paddingY);
  const percent = (value: number, total: number) => Math.round((value / total) * 1000) / 10;
  return { x: percent(minX, width), y: percent(minY, height), width: percent(maxX - minX + 1, width), height: percent(maxY - minY + 1, height), confidence: camera.pixels >= minimumPixels * 4 ? "HIGH" : "MEDIUM" };
}
