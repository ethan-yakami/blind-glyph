import { getAnchorPoint } from './levelRules.js';

export function getScanSegments(level, a, b, boardSize) {
  if (level.mode === 'laserGun') {
    return [
      {
        id: 'laser',
        label: '',
        from: { ...a },
        to: extendToBoardEdge(a, b, boardSize),
      },
    ];
  }

  if (level.mode === 'radar') {
    const radius = level._runtimeRadius ?? level.radius ?? 160;
    const angle = level._runtimeAngle ?? 0;
    return [
      {
        id: 'radar',
        label: '',
        from: { ...a },
        to: {
          x: Math.round(a.x + Math.cos(angle) * radius),
          y: Math.round(a.y + Math.sin(angle) * radius),
        },
      },
    ];
  }

  if (['sonarPoint', 'ripple', 'radialWave'].includes(level.mode)) {
    return [];
  }

  if (level.mode === 'dualAnchor') {
    return [
      {
        id: 'anchor-a',
        label: 'A',
        from: getAnchorPoint(level.anchorA, boardSize),
        to: { ...a },
      },
      {
        id: 'anchor-b',
        label: 'B',
        from: getAnchorPoint(level.anchorB, boardSize),
        to: { ...b },
      },
    ];
  }

  return [
    {
      id: 'ab',
      label: '',
      from: { ...a },
      to: { ...b },
    },
  ];
}

function extendToBoardEdge(from, toward, boardSize) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  let point = { ...from };

  for (let step = 0; step < boardSize * 2; step += 1) {
    const next = {
      x: Math.round(from.x + ux * step),
      y: Math.round(from.y + uy * step),
    };
    if (next.x < 0 || next.x >= boardSize || next.y < 0 || next.y >= boardSize) break;
    point = next;
  }
  return point;
}
