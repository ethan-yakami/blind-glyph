import { clampPoint } from './scanEngine.js';

export function createRadialWaveRays(matrix, origin, {
  rayCount = 12,
  maxRadius = 280,
  step = 2,
  hitRadius = 3,
  revealDuration = 820,
} = {}) {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  const rays = [];

  for (let index = 0; index < rayCount; index += 1) {
    const angle = (index / rayCount) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let hit = null;
    let distance = maxRadius;

    for (let radius = 0; radius <= maxRadius; radius += step) {
      const point = clampPoint({
        x: origin.x + dx * radius,
        y: origin.y + dy * radius,
      }, width, height);

      if (hasNearbyHit(matrix, point, hitRadius)) {
        hit = point;
        distance = radius;
        break;
      }
    }

    rays.push({
      angle,
      distance,
      hit,
      revealAt: (distance / maxRadius) * revealDuration,
      end: hit ?? clampPoint({
        x: origin.x + dx * maxRadius,
        y: origin.y + dy * maxRadius,
      }, width, height),
    });
  }

  return rays;
}

function hasNearbyHit(matrix, point, radius) {
  for (let y = point.y - radius; y <= point.y + radius; y += 1) {
    for (let x = point.x - radius; x <= point.x + radius; x += 1) {
      if (matrix[y]?.[x]) return true;
    }
  }
  return false;
}
