export function clampPoint(point, width, height) {
  return {
    x: Math.max(0, Math.min(width - 1, Math.round(point.x))),
    y: Math.max(0, Math.min(height - 1, Math.round(point.y))),
  };
}

export function constrainHorizontal(a, b) {
  return {
    a: { ...a },
    b: { x: b.x, y: a.y },
  };
}

export function constrainFixedAnchor(anchor, b) {
  return {
    a: { ...anchor },
    b: { ...b },
  };
}

export function createMatrixFromRects(width, height, rects) {
  const matrix = Array.from({ length: height }, () => Array(width).fill(false));
  for (const rect of rects) {
    const left = Math.max(0, Math.floor(rect.x));
    const top = Math.max(0, Math.floor(rect.y));
    const right = Math.min(width, Math.ceil(rect.x + rect.w));
    const bottom = Math.min(height, Math.ceil(rect.y + rect.h));
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        matrix[y][x] = true;
      }
    }
  }
  return matrix;
}

export function scanSegment(matrix, a, b) {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const totalSamples = Math.max(1, Math.round(distance) + 1);
  let hitSamples = 0;

  for (let i = 0; i < totalSamples; i += 1) {
    const t = totalSamples === 1 ? 0 : i / (totalSamples - 1);
    const point = clampPoint({ x: a.x + dx * t, y: a.y + dy * t }, width, height);
    if (matrix[point.y]?.[point.x]) hitSamples += 1;
  }

  const percent = Math.round((hitSamples / totalSamples) * 100);
  return {
    distance,
    totalSamples,
    hitSamples,
    percent,
  };
}
