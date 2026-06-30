import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMetric } from './metricDisplay.js';

test('formatMetric shows percent for standard levels', () => {
  assert.equal(
    formatMetric({ distance: 250, hitSamples: 25, totalSamples: 100, percent: 25 }, { metricMode: 'percent' }),
    '长度比例：500 / 25%',
  );
});

test('formatMetric shows hit length for length levels', () => {
  assert.equal(
    formatMetric({ distance: 250, hitSamples: 45, totalSamples: 100, percent: 45 }, { metricMode: 'length' }),
    '检测长度：500 / 225',
  );
});
