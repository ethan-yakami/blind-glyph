import {
  formatInlineMetric,
  formatSegmentMetric,
} from './metricDisplay.js';

export function createCanvasRenderer(canvas, boardSize) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = boardSize;
  canvas.height = boardSize;

  function drawGrid(showGrid) {
    if (!showGrid) return;
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= boardSize; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, boardSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(boardSize, i);
      ctx.stroke();
    }

    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 2;
    for (let i = 0; i <= boardSize; i += 125) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, boardSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(boardSize, i);
      ctx.stroke();
    }
  }

  function drawLine(a, b, color, width = 3, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawProbe(point, label, color, locked = false) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = locked ? 3 : 2.5;
    ctx.beginPath();
    ctx.arc(point.x, point.y, locked ? 8 : 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, point.x, point.y - 11);
    ctx.restore();
  }

  function drawGun(point) {
    ctx.save();
    const displayPoint = {
      x: Math.max(14, Math.min(boardSize - 14, point.x)),
      y: Math.max(14, Math.min(boardSize - 14, point.y)),
    };
    ctx.translate(displayPoint.x, displayPoint.y);
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-9, -5, 18, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(2, 3, 5, 11);
    ctx.restore();
  }

  function getAnchorPoint(name) {
    const map = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: boardSize - 1, y: 0 },
      bottomLeft: { x: 0, y: boardSize - 1 },
      bottomRight: { x: boardSize - 1, y: boardSize - 1 },
    };
    return map[name] ?? map.bottomRight;
  }

  function drawAnchor(point, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawDualAnchors(level, a, b) {
    if (level.mode !== 'dualAnchor') return;
    const anchorA = getAnchorPoint(level.anchorA);
    const anchorB = getAnchorPoint(level.anchorB);
    drawLine(anchorA, a, 'rgba(255, 75, 75, 0.22)', 2, true);
    drawLine(anchorB, b, 'rgba(47, 87, 255, 0.22)', 2, true);
    drawAnchor(anchorA, '#ff4b4b');
    drawAnchor(anchorB, '#2f57ff');
  }

  function drawRadar(view) {
    if (view.level.mode !== 'radar') return;
    ctx.save();
    ctx.strokeStyle = 'rgba(42, 157, 85, 0.26)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(view.a.x, view.a.y, view.radar.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawRipples(view) {
    if (view.revealedRipplePoints?.length) {
      ctx.save();
      for (const point of view.revealedRipplePoints) {
        const ttl = view.level.revealTtlMs ?? null;
        const remaining = point.expiresAt && ttl
          ? Math.max(0, Math.min(1, (point.expiresAt - performance.now()) / ttl))
          : 1;
        ctx.fillStyle = `rgba(42, 157, 85, ${0.52 * remaining})`;
        ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
      }
      ctx.restore();
    }

    for (const effect of view.effects) {
      if (effect.type !== 'ripple') continue;
      const progress = effect.age / effect.duration;
      const radius = progress * 260;
      ctx.save();
      ctx.strokeStyle = `rgba(82, 170, 98, ${0.28 * (1 - progress)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.point.x, effect.point.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawRippleHits(effect, radius);
    }
  }

  function drawRadialWaves(view) {
    for (const effect of view.effects) {
      if (effect.type !== 'radialWave') continue;
      const progress = Math.min(1, effect.age / effect.duration);
      ctx.save();
      ctx.lineCap = 'round';
      for (const ray of effect.rays ?? []) {
        const visibleDistance = Math.min(ray.distance, progress * 280);
        const end = {
          x: effect.point.x + Math.cos(ray.angle) * visibleDistance,
          y: effect.point.y + Math.sin(ray.angle) * visibleDistance,
        };
        ctx.strokeStyle = 'rgba(58, 150, 76, 0.74)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(effect.point.x, effect.point.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        if (ray.hit && effect.age >= ray.revealAt) {
          const localAge = effect.age - ray.revealAt;
          const rippleProgress = Math.min(1, localAge / 900);
          const alpha = Math.max(0, 1 - rippleProgress);
          ctx.strokeStyle = `rgba(14, 145, 62, ${alpha})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(ray.hit.x, ray.hit.y, 6 + rippleProgress * 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(14, 145, 62, ${alpha})`;
          ctx.beginPath();
          ctx.arc(ray.hit.x, ray.hit.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function drawRippleHits(effect) {
    ctx.save();
    for (const hit of effect.hits ?? []) {
      const localAge = effect.age - hit.revealAt;
      if (localAge < 0 || localAge > 420) continue;
      const alpha = 1 - localAge / 420;
      ctx.fillStyle = `rgba(42, 157, 85, ${0.75 * alpha})`;
      ctx.fillRect(hit.x - 3, hit.y - 3, 6, 6);
    }
    ctx.restore();
  }

  function drawMetric(a, b, result, level) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const distance = Math.round(result.distance * 2);
    ctx.save();
    ctx.font = '700 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = result.percent >= 98 ? '#2a9d55' : '#111111';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    const text = formatInlineMetric(result, level);
    ctx.strokeText(text, mx, my - 12);
    ctx.fillText(text, mx, my - 12);
    ctx.restore();
  }

  function drawSavedMetric(record, level) {
    const mx = (record.from.x + record.to.x) / 2;
    const my = (record.from.y + record.to.y) / 2;
    ctx.save();
    ctx.font = '700 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(82, 170, 98, 0.58)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    const text = formatSegmentMetric(record, level);
    ctx.strokeText(text, mx, my - 12);
    ctx.fillText(text, mx, my - 12);
    ctx.restore();
  }

  function render(view) {
    ctx.clearRect(0, 0, boardSize, boardSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, boardSize, boardSize);
    drawGrid(view.showGrid);

    if (view.showGlyph && view.glyphCanvas) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(view.glyphCanvas, 0, 0);
      ctx.restore();
    }

    drawRadar(view);
    drawRipples(view);
    drawRadialWaves(view);

    for (const scan of view.scans) {
      const savedSegments = scan.segmentResults?.length
        ? scan.segmentResults
        : [{ from: scan.a, to: scan.b, result: scan.result, label: '' }];
      for (const segment of savedSegments) {
        if (view.level.mode === 'laserGun') {
          drawLine(segment.from, segment.to, 'rgba(42, 157, 85, 0.13)', 2, false);
          for (const hitSegment of segment.hitSegments ?? []) {
            drawLine(hitSegment.from, hitSegment.to, 'rgba(42, 157, 85, 0.9)', 5, false);
          }
        } else {
          drawLine(segment.from, segment.to, 'rgba(96, 160, 102, 0.28)', 2, true);
          drawSavedMetric(segment, view.level);
        }
      }
    }

    drawDualAnchors(view.level, view.a, view.b);
    if (view.level.mode === 'sonarPoint') {
      drawProbe(view.a, 'A', '#ff4b4b');
      return;
    }

    if (view.level.mode === 'ripple' || view.level.mode === 'radialWave') {
      return;
    }

    if (view.level.mode === 'laserGun') {
      const segment = view.segmentResults[0];
      drawLine(segment.from, segment.to, 'rgba(42, 157, 85, 0.18)', 2, true);
      drawGun(view.a);
      drawProbe(view.b, '', '#2f57ff');
      return;
    }

    const activeColor = view.level.mode === 'radar'
      ? (view.result.percent >= 98 ? '#d93a32' : '#2a9d55')
      : (view.result.percent >= 98 ? '#2a9d55' : '#111111');
    for (const segment of view.segmentResults) {
      drawLine(segment.from, segment.to, activeColor, 3, true);
      drawMetric(segment.from, segment.to, segment.result, view.level);
    }
    drawProbe(view.a, 'A', '#ff4b4b', view.lockA);
    if (view.level.mode === 'radar') return;
    drawProbe(view.b, 'B', '#2f57ff');
  }

  return { render };
}
