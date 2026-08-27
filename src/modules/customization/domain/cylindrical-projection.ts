export type CylindricalSlice = {
  sourceX: number;
  sourceWidth: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function cylindricalProjection(sourceWidth: number, destinationWidth: number, destinationHeight: number, stripCount = 36): CylindricalSlice[] {
  const count = Math.max(12, Math.round(stripCount));
  const visibleAngle = 2.35;
  const halfSine = Math.sin(visibleAngle / 2);
  const projectedX = (progress: number) => destinationWidth * (.5 + Math.sin((progress - .5) * visibleAngle) / (2 * halfSine));

  return Array.from({ length: count }, (_, index) => {
    const start = index / count;
    const end = (index + 1) / count;
    const middle = (start + end) / 2;
    const edgeDistance = Math.abs(middle - .5) * 2;
    const bow = destinationHeight * .045 * edgeDistance ** 2;
    const x = projectedX(start);
    const nextX = projectedX(end);

    return {
      sourceX: sourceWidth * start,
      sourceWidth: sourceWidth / count,
      x,
      y: bow,
      width: nextX - x,
      height: destinationHeight - bow * 2,
    };
  });
}
