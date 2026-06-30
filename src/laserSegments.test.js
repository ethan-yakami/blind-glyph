import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaserHitSegments } from './laserSegments.js';
import { createMatrixFromRects } from './scanEngine.js';

test('getLaserHitSegments returns the full filled intervals crossed by the laser', () => {
  const matrix = createMatrixFromRects(100, 20, [{ x: 20, y: 10, w: 11, h: 1 }]);
  const segments = getLaserHitSegments(matrix, { x: 0, y: 10 }, { x: 99, y: 10 });

  assert.equal(segments.length, 1);
  assert.ok(segments[0].from.x >= 19 && segments[0].from.x <= 21);
  assert.ok(segments[0].to.x >= 29 && segments[0].to.x <= 31);
  assert.ok(segments[0].to.x - segments[0].from.x >= 9);
});
