import test from 'node:test';
import assert from 'node:assert/strict';
import { getScanSegments } from './scanSegments.js';

test('getScanSegments returns a single A-B segment for standard levels', () => {
  const segments = getScanSegments(
    { mode: 'free' },
    { x: 10, y: 20 },
    { x: 30, y: 40 },
    500,
  );

  assert.deepEqual(segments, [
    {
      id: 'ab',
      label: '',
      from: { x: 10, y: 20 },
      to: { x: 30, y: 40 },
    },
  ]);
});

test('getScanSegments returns two anchor-probe segments for dual-anchor levels', () => {
  const segments = getScanSegments(
    { mode: 'dualAnchor', anchorA: 'topLeft', anchorB: 'bottomRight' },
    { x: 120, y: 80 },
    { x: 420, y: 460 },
    500,
  );

  assert.deepEqual(segments, [
    {
      id: 'anchor-a',
      label: 'A',
      from: { x: 0, y: 0 },
      to: { x: 120, y: 80 },
    },
    {
      id: 'anchor-b',
      label: 'B',
      from: { x: 499, y: 499 },
      to: { x: 420, y: 460 },
    },
  ]);
});
