import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatrixFromRects } from './scanEngine.js';
import { createRadialWaveRays } from './radialWave.js';

test('createRadialWaveRays stops each ray at the first hidden stroke pixel', () => {
  const matrix = createMatrixFromRects(100, 100, [
    { x: 70, y: 50, w: 1, h: 1 },
    { x: 50, y: 20, w: 1, h: 1 },
  ]);
  const rays = createRadialWaveRays(matrix, { x: 50, y: 50 }, {
    rayCount: 4,
    maxRadius: 40,
    step: 1,
  });

  assert.equal(rays.length, 4);
  assert.ok(rays[0].hit.x >= 67 && rays[0].hit.x <= 70);
  assert.equal(rays[0].hit.y, 50);
  assert.equal(rays[3].hit.x, 50);
  assert.ok(rays[3].hit.y >= 20 && rays[3].hit.y <= 23);
  assert.equal(rays[1].hit, null);
});
