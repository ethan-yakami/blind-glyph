import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyLevelConstraints,
  getAnchorPoint,
  getStarRating,
  isAnswerCorrect,
} from './levelRules.js';

test('getAnchorPoint returns a padded board corner', () => {
  assert.deepEqual(getAnchorPoint('bottomRight', 500), { x: 499, y: 499 });
});

test('applyLevelConstraints keeps horizontal levels on one row', () => {
  const next = applyLevelConstraints(
    { mode: 'horizontal' },
    { x: 20, y: 80 },
    { x: 450, y: 120 },
    500,
  );

  assert.deepEqual(next, {
    a: { x: 20, y: 80 },
    b: { x: 450, y: 80 },
  });
});

test('applyLevelConstraints pins fixed-anchor levels', () => {
  const next = applyLevelConstraints(
    { mode: 'fixed', fixedAnchor: 'topLeft' },
    { x: 300, y: 300 },
    { x: 450, y: 120 },
    500,
  );

  assert.deepEqual(next, {
    a: { x: 0, y: 0 },
    b: { x: 450, y: 120 },
  });
});

test('applyLevelConstraints lets dual-anchor probes move across the whole board', () => {
  const next = applyLevelConstraints(
    {
      mode: 'dualAnchor',
      anchorA: 'topLeft',
      anchorB: 'bottomRight',
      maxAnchorDistance: 180,
    },
    { x: 620, y: -20 },
    { x: 100, y: 499 },
    500,
  );

  assert.deepEqual(next.a, { x: 499, y: 0 });
  assert.deepEqual(next.b, { x: 100, y: 499 });
});

test('getStarRating maps elapsed seconds to demo ratings', () => {
  assert.equal(getStarRating(60), 3);
  assert.equal(getStarRating(61), 2);
  assert.equal(getStarRating(300), 2);
  assert.equal(getStarRating(301), 1);
});

test('isAnswerCorrect trims player input', () => {
  assert.equal(isAnswerCorrect(' 中 ', '中'), true);
  assert.equal(isAnswerCorrect('忠', '中'), false);
});
