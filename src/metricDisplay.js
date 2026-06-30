export function getScaledDistance(result) {
  return Math.round(result.distance * 2);
}

export function getScaledHitLength(result) {
  return Math.round(getScaledDistance(result) * (result.hitSamples / result.totalSamples));
}

export function formatMetric(result, level) {
  const distance = getScaledDistance(result);
  if (level.metricMode === 'length') {
    return `检测长度：${distance} / ${getScaledHitLength(result)}`;
  }
  return `长度比例：${distance} / ${result.percent}%`;
}

export function formatInlineMetric(result, level) {
  const distance = getScaledDistance(result);
  if (level.metricMode === 'length') {
    return `${distance} / ${getScaledHitLength(result)}`;
  }
  return `${distance} / ${result.percent}%`;
}

export function formatSegmentMetric(segmentResult, level) {
  return formatInlineMetric(segmentResult.result, level);
}

export function formatCombinedMetric(segmentResults, level) {
  if (segmentResults.length === 1) return formatMetric(segmentResults[0].result, level);
  return segmentResults
    .map((segmentResult) => `${segmentResult.label} ${formatInlineMetric(segmentResult.result, level)}`)
    .join('  ');
}
