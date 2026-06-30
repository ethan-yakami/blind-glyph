import {
  clampPoint,
  constrainFixedAnchor,
  constrainHorizontal,
} from './scanEngine.js';

export function getAnchorPoint(name, boardSize) {
  const map = {
    topLeft: { x: 0, y: 0 },
    topRight: { x: boardSize - 1, y: 0 },
    bottomLeft: { x: 0, y: boardSize - 1 },
    bottomRight: { x: boardSize - 1, y: boardSize - 1 },
  };
  return map[name] ?? map.bottomRight;
}

export function applyLevelConstraints(level, a, b, boardSize) {
  if (level.mode === 'horizontal') {
    const next = constrainHorizontal(a, b);
    return {
      a: clampPoint(next.a, boardSize, boardSize),
      b: clampPoint(next.b, boardSize, boardSize),
    };
  }

  if (level.mode === 'fixed') {
    const next = constrainFixedAnchor(getAnchorPoint(level.fixedAnchor, boardSize), b);
    return {
      a: clampPoint(next.a, boardSize, boardSize),
      b: clampPoint(next.b, boardSize, boardSize),
    };
  }

  if (level.mode === 'dualAnchor') {
    return {
      a: clampPoint(a, boardSize, boardSize),
      b: clampPoint(b, boardSize, boardSize),
    };
  }

  if (level.mode === 'laserGun') {
    return {
      a: clampToBorder(clampPoint(a, boardSize, boardSize), boardSize),
      b: clampPoint(b, boardSize, boardSize),
    };
  }

  return {
    a: clampPoint(a, boardSize, boardSize),
    b: clampPoint(b, boardSize, boardSize),
  };
}

function clampToBorder(point, boardSize) {
  const distances = [
    { side: 'left', value: point.x },
    { side: 'right', value: boardSize - 1 - point.x },
    { side: 'top', value: point.y },
    { side: 'bottom', value: boardSize - 1 - point.y },
  ];
  const nearest = distances.sort((a, b) => a.value - b.value)[0].side;
  if (nearest === 'left') return { x: 0, y: point.y };
  if (nearest === 'right') return { x: boardSize - 1, y: point.y };
  if (nearest === 'top') return { x: point.x, y: 0 };
  return { x: point.x, y: boardSize - 1 };
}


export function getStarRating(seconds) {
  if (seconds <= 60) return 3;
  if (seconds <= 300) return 2;
  return 1;
}

export function formatStars(count) {
  return '★'.repeat(count) + '☆'.repeat(3 - count);
}

export function isAnswerCorrect(input, answer) {
  return input.trim() === answer;
}
