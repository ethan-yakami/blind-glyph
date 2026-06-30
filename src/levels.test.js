import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from './levels.js';

test('level 10 elephant ripple reveal points expire after one second', () => {
  const level = levels.find((item) => item.id === 10);

  assert.equal(level.mode, 'ripple');
  assert.equal(level.targetType, 'elephant');
  assert.equal(level.revealTtlMs, 1000);
});

test('level 9 uses radial wave rays instead of linear scanning', () => {
  const level = levels.find((item) => item.id === 9);

  assert.equal(level.mode, 'radialWave');
  assert.equal(level.rayCount, 12);
  assert.match(level.rules.join(' '), /12 条射线/);
});
