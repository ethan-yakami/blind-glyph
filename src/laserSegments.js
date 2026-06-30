import { clampPoint } from './scanEngine.js';

export function getLaserHitSegments(matrix, from, to) {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const totalSamples = Math.max(1, Math.round(distance) + 1);
  const hitSegments = [];
  let activeStart = null;
  let previousPoint = null;

  for (let i = 0; i < totalSamples; i += 1) {
    const t = totalSamples === 1 ? 0 : i / (totalSamples - 1);
    const point = clampPoint({ x: from.x + dx * t, y: from.y + dy * t }, width, height);
    const isHit = Boolean(matrix[point.y]?.[point.x]);

    if (isHit && !activeStart) {
      activeStart = point;
    }

    if (!isHit && activeStart && previousPoint) {
      hitSegments.push({ from: activeStart, to: previousPoint });
      activeStart = null;
    }

    previousPoint = point;
  }

  if (activeStart && previousPoint) {
    hitSegments.push({ from: activeStart, to: previousPoint });
  }

  return hitSegments;
}
