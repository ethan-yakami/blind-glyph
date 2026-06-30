import {
  getScaledDistance,
  getScaledHitLength,
} from './metricDisplay.js';

export const MAX_SCAN_RECORDS = 3;

export function createScanRecord({ id, a, b, result, segmentResults = [] }) {
  return {
    id,
    a: { ...a },
    b: { ...b },
    result: { ...result },
    segmentResults: segmentResults.map((segmentResult) => ({
      ...segmentResult,
      from: { ...segmentResult.from },
      to: { ...segmentResult.to },
      result: { ...segmentResult.result },
      hitSegments: (segmentResult.hitSegments ?? []).map((segment) => ({
        from: { ...segment.from },
        to: { ...segment.to },
      })),
    })),
  };
}

export function addScanRecord(records, record, limit = MAX_SCAN_RECORDS) {
  if (records.length >= limit) return false;
  records.push(record);
  return true;
}

export function undoLastScanRecord(records) {
  return records.pop() ?? null;
}

export function clearScanRecords(records) {
  records.splice(0, records.length);
  return records;
}

export function formatRecordSummary(record) {
  return `#${record.id} ${getScaledDistance(record.result)} / ${getScaledHitLength(record.result)} / ${record.result.percent}%`;
}
