import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fitBoundsIntoBox,
  getMatrixBounds,
} from './glyphMatrix.js';

test('getMatrixBounds finds filled pixel bounds', () => {
  const matrix = [
    [false, false, false, false],
    [false, true, true, false],
    [false, true, false, false],
  ];

  assert.deepEqual(getMatrixBounds(matrix), {
    minX: 1,
    minY: 1,
    maxX: 2,
    maxY: 2,
    width: 2,
    height: 2,
  });
});

test('fitBoundsIntoBox centers and scales content into the target box', () => {
  const fit = fitBoundsIntoBox({
    bounds: { minX: 10, minY: 20, width: 100, height: 200 },
    boardSize: 500,
    targetRatio: 0.7,
  });

  assert.equal(fit.sourceWidth, 100);
  assert.equal(fit.sourceHeight, 200);
  assert.equal(fit.destWidth, 175);
  assert.equal(fit.destHeight, 350);
  assert.equal(fit.destX, 162.5);
  assert.equal(fit.destY, 75);
});
