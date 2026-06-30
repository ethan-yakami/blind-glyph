import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addScanRecord,
  formatRecordSummary,
  MAX_SCAN_RECORDS,
  undoLastScanRecord,
} from './scanHistory.js';

const baseRecord = {
  a: { x: 0, y: 0 },
  b: { x: 10, y: 0 },
  result: { distance: 10, hitSamples: 5, totalSamples: 10, percent: 50 },
};

test('addScanRecord rejects new records when the limit is reached', () => {
  const records = [];
  for (let i = 0; i < MAX_SCAN_RECORDS; i += 1) {
    addScanRecord(records, { ...baseRecord, id: i + 1 }, MAX_SCAN_RECORDS);
  }

  const added = addScanRecord(records, { ...baseRecord, id: 4 }, MAX_SCAN_RECORDS);

  assert.equal(added, false);
  assert.deepEqual(records.map((record) => record.id), [1, 2, 3]);
});

test('undoLastScanRecord removes and returns the newest record', () => {
  const records = [{ ...baseRecord, id: 1 }, { ...baseRecord, id: 2 }];

  const removed = undoLastScanRecord(records);

  assert.equal(removed.id, 2);
  assert.deepEqual(records.map((record) => record.id), [1]);
});

test('formatRecordSummary includes distance hit length and percent', () => {
  const text = formatRecordSummary({ ...baseRecord, id: 3 }, { metricMode: 'percent' });

  assert.equal(text, '#3 20 / 10 / 50%');
});
