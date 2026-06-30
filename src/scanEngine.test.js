import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampPoint,
  constrainHorizontal,
  constrainFixedAnchor,
  createMatrixFromRects,
  scanSegment,
} from './scanEngine.js';

test('scanSegment returns 100 when the whole segment crosses filled pixels', () => {
  const matrix = createMatrixFromRects(100, 100, [{ x: 0, y: 50, w: 100, h: 1 }]);
  const result = scanSegment(matrix, { x: 0, y: 50 }, { x: 99, y: 50 });

  assert.equal(result.percent, 100);
  assert.equal(result.hitSamples, result.totalSamples);
});

test('scanSegment returns about half when half the segment is filled', () => {
  const matrix = createMatrixFromRects(100, 100, [{ x: 0, y: 50, w: 50, h: 1 }]);
  const result = scanSegment(matrix, { x: 0, y: 50 }, { x: 99, y: 50 });

  assert.ok(result.percent >= 49 && result.percent <= 51);
});

test('constrainHorizontal keeps B on the same row as A', () => {
  const next = constrainHorizontal({ x: 10, y: 20 }, { x: 70, y: 80 });

  assert.deepEqual(next, { a: { x: 10, y: 20 }, b: { x: 70, y: 20 } });
});

test('constrainFixedAnchor pins A and leaves B movable', () => {
  const next = constrainFixedAnchor({ x: 0, y: 99 }, { x: 40, y: 50 });

  assert.deepEqual(next, { a: { x: 0, y: 99 }, b: { x: 40, y: 50 } });
});

test('clampPoint keeps coordinates inside the board', () => {
  assert.deepEqual(clampPoint({ x: -10, y: 120 }, 100, 100), { x: 0, y: 99 });
});
