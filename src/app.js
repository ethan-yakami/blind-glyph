import { BOARD_SIZE, levels } from './levels.js';
import { createCanvasRenderer } from './canvasRenderer.js';
import { createGlyphMatrix } from './glyphMatrix.js';
import { createInputController } from './inputController.js';
import {
  applyLevelConstraints,
  formatStars,
  getStarRating,
  isAnswerCorrect,
} from './levelRules.js';
import { clampPoint, scanSegment } from './scanEngine.js';
import { getScanSegments } from './scanSegments.js';
import { getLaserHitSegments } from './laserSegments.js';
import { createRadialWaveRays } from './radialWave.js';
import {
  addScanRecord,
  clearScanRecords,
  createScanRecord,
  undoLastScanRecord,
} from './scanHistory.js';
import { createUiController } from './uiController.js?v=hide-basic-rules-1';

const elements = {
  canvas: document.querySelector('#board'),
  levelButtons: document.querySelector('#levelButtons'),
  answerInput: document.querySelector('#answerInput'),
  showAnswerToggle: document.querySelector('#showAnswerToggle'),
  levelRule: document.querySelector('#levelRule'),
  levelNote: document.querySelector('#levelNote'),
  rulesList: document.querySelector('#rulesList'),
  metricLine: document.querySelector('#metricLine'),
  rating: document.querySelector('#rating'),
  message: document.querySelector('#message'),
  radarControls: document.querySelector('#radarControls'),
  radiusSlider: document.querySelector('#radiusSlider'),
  speedSlider: document.querySelector('#speedSlider'),
  modeControls: [...document.querySelectorAll('[data-control]')],
};

const state = {
  levelIndex: 0,
  level: levels[0],
  a: { ...levels[0].initialA },
  b: { ...levels[0].initialB },
  matrix: [],
  glyphCanvas: null,
  dragging: null,
  scans: [],
  nextScanId: 1,
  startedAt: Date.now(),
  solved: new Map(),
  showGrid: true,
  showGlyph: false,
  result: null,
  segmentResults: [],
  effects: [],
  ripplePoints: [],
  revealedRipplePoints: [],
  radar: { radius: 160, speed: 0.55, angle: 0, lastTime: 0 },
  lastRippleAt: 0,
  pointerDown: false,
};

const renderer = createCanvasRenderer(elements.canvas, BOARD_SIZE);
let ui;
let animationFrame = null;

function constrainProbes() {
  const next = applyLevelConstraints(state.level, state.a, state.b, BOARD_SIZE);
  state.a = next.a;
  state.b = next.b;
}

function updateScanResult() {
  if (['ripple', 'radialWave', 'sonarPoint'].includes(state.level.mode)) {
    state.segmentResults = [];
    state.result = { distance: 0, hitCount: 0, sampleCount: 0, percent: 0 };
    return;
  }

  const scanLevel = {
    ...state.level,
    _runtimeAngle: state.radar.angle,
    _runtimeRadius: state.radar.radius,
  };
  state.segmentResults = getScanSegments(scanLevel, state.a, state.b, BOARD_SIZE).map((segment) => ({
    ...segment,
    result: scanSegment(state.matrix, segment.from, segment.to),
    hitSegments: state.level.mode === 'laserGun'
      ? getLaserHitSegments(state.matrix, segment.from, segment.to)
      : [],
  }));
  state.result = state.segmentResults[0]?.result ?? scanSegment(state.matrix, state.a, state.b);
}

function createRipplePointCache(matrix, step = 7) {
  const points = [];
  for (let y = 0; y < BOARD_SIZE; y += step) {
    for (let x = 0; x < BOARD_SIZE; x += step) {
      if (matrix[y]?.[x]) points.push({ x, y });
    }
  }
  return points;
}

function buildView() {
  return {
    level: state.level,
    a: state.a,
    b: state.b,
    scans: state.scans,
    result: state.result,
    segmentResults: state.segmentResults,
    showGrid: state.showGrid,
    showGlyph: state.showGlyph,
    glyphCanvas: state.glyphCanvas,
    matrix: state.matrix,
    lockA: state.level.mode === 'fixed',
    startedAt: state.startedAt,
    solved: state.solved,
    dragging: state.dragging,
    effects: state.effects,
    revealedRipplePoints: state.revealedRipplePoints,
    radar: state.radar,
  };
}

function render(now = performance.now()) {
  updateEffects(now);
  updateScanResult();
  const view = buildView();
  renderer.render(view);
  ui.update(view);
}

function needsAnimation() {
  return state.level.mode === 'radar'
    || state.effects.length > 0
    || state.revealedRipplePoints.some((point) => point.expiresAt);
}

function requestRenderLoop() {
  if (animationFrame !== null) return;
  animationFrame = requestAnimationFrame(tick);
}

function renderAndSchedule(now = performance.now()) {
  render(now);
  if (needsAnimation()) requestRenderLoop();
}

function loadLevel(index) {
  state.levelIndex = index;
  state.level = levels[index];
  state.a = { ...state.level.initialA };
  state.b = { ...state.level.initialB };
  constrainProbes();
  const glyph = createGlyphMatrix({
    char: state.level.targetType === 'elephant' ? '象剪影' : state.level.answer,
    boardSize: BOARD_SIZE,
  });
  state.matrix = glyph.matrix;
  state.glyphCanvas = glyph.canvas;
  state.dragging = null;
  state.scans = [];
  state.nextScanId = 1;
  state.startedAt = Date.now();
  state.showGlyph = false;
  state.effects = [];
  state.revealedRipplePoints = [];
  state.ripplePoints = state.level.mode === 'ripple'
    ? createRipplePointCache(state.matrix, state.level.targetType === 'elephant' ? 8 : 7)
    : [];
  state.radar = {
    radius: state.level.radius ?? 160,
    speed: state.level.speed ?? 0.55,
    angle: 0,
    lastTime: performance.now(),
  };
  state.lastRippleAt = 0;
  ui.resetInputs();
  renderAndSchedule();
}

function setProbe(which, point) {
  if (which === 'a') state.a = clampPoint(point, BOARD_SIZE, BOARD_SIZE);
  if (which === 'b') state.b = clampPoint(point, BOARD_SIZE, BOARD_SIZE);
  constrainProbes();
  render();
}

function moveProbe(which, dx, dy) {
  const point = which === 'a' ? state.a : state.b;
  setProbe(which, { x: point.x + dx, y: point.y + dy });
}

function recordScan() {
  updateScanResult();
  if (state.level.mode === 'ripple' || state.level.mode === 'radialWave') {
    ui.setMessage('本关通过点击画布产生声波，不使用记录扫描。');
    return;
  }
  if (state.level.mode === 'sonarPoint') {
    ui.setMessage('本关只通过声音探测，不使用记录扫描。');
    return;
  }
  if (state.level.mode === 'radar') {
    ui.setMessage('雷达正在自动扫描，不需要记录扫描。');
    return;
  }
  const added = addScanRecord(
    state.scans,
    createScanRecord({
      id: state.nextScanId,
      a: state.a,
      b: state.b,
      result: state.result,
      segmentResults: state.segmentResults,
    }),
    state.level.shotLimit ?? 3,
  );
  if (!added) {
    const limit = state.level.shotLimit ?? 3;
    ui.setMessage(`最多记录 ${limit} 个，请先撤销一步或清空全部。`);
    return;
  }
  state.nextScanId += 1;
  ui.setMessage('');
  render();
}

function updateEffects(now) {
  if (state.level.mode === 'radar') {
    const elapsed = Math.max(0, now - state.radar.lastTime) / 1000;
    state.radar.lastTime = now;
    state.radar.angle = (state.radar.angle + elapsed * state.radar.speed * Math.PI * 2) % (Math.PI * 2);
  }

  state.effects = state.effects
    .map((effect) => ({ ...effect, age: now - effect.createdAt }))
    .filter((effect) => effect.age < effect.duration);

  state.revealedRipplePoints = state.revealedRipplePoints.filter((point) => (
    !point.expiresAt || point.expiresAt > now
  ));
}

function undoScan() {
  undoLastScanRecord(state.scans);
  render();
}

function clearScans() {
  clearScanRecords(state.scans);
  render();
}

function resetLevel() {
  loadLevel(state.levelIndex);
}

function submitAnswer() {
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  if (isAnswerCorrect(elements.answerInput.value, state.level.answer)) {
    const stars = formatStars(getStarRating(elapsed));
    state.solved.set(state.level.id, { seconds: elapsed, stars });
    ui.setMessage(`正确，用时 ${elapsed}s，评级 ${stars}`);
  } else {
    ui.setMessage('答案不对，可以继续尝试。');
  }
  render();
}

function toggleAnswer(checked) {
  state.showGlyph = checked;
  ui.setMessage(checked ? `当前关答案：${state.level.answer}` : '');
  render();
}

function boardPointFromEvent(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return clampPoint({
    x: ((event.clientX - rect.left) / rect.width) * BOARD_SIZE,
    y: ((event.clientY - rect.top) / rect.height) * BOARD_SIZE,
  }, BOARD_SIZE, BOARD_SIZE);
}

function triggerRipple(point) {
  const now = performance.now();
  const cooldown = state.level.cooldownMs ?? 1000;
  if (now - state.lastRippleAt < cooldown) return;
  state.lastRippleAt = now;
  const hits = collectRippleHits(point);
  state.revealedRipplePoints = mergeRevealedRipplePoints(
    state.revealedRipplePoints,
    hits,
    520,
    now,
    state.level.revealTtlMs ?? null,
  );
  state.effects.push({
    type: 'ripple',
    point,
    createdAt: now,
    duration: state.level.revealTtlMs ?? 1400,
    hits,
  });
  state.effects = state.effects.slice(-2);
  renderAndSchedule(now);
}

function triggerRadialWave(point) {
  const now = performance.now();
  const cooldown = state.level.cooldownMs ?? 1000;
  if (now - state.lastRippleAt < cooldown) return;
  state.lastRippleAt = now;
  state.effects.push({
    type: 'radialWave',
    point,
    createdAt: now,
    duration: 1800,
    rays: createRadialWaveRays(state.matrix, point, {
      rayCount: state.level.rayCount ?? 12,
      maxRadius: 280,
      step: 2,
      hitRadius: 4,
      revealDuration: 950,
    }),
  });
  state.effects = state.effects.slice(-3);
  renderAndSchedule(now);
}

function collectRippleHits(point) {
  const hits = [];
  const maxRadius = 280;
  const maxRadiusSq = maxRadius * maxRadius;
  const maxHits = state.level.targetType === 'elephant' ? 120 : 90;

  for (const target of state.ripplePoints) {
    const dx = target.x - point.x;
    const dy = target.y - point.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > maxRadiusSq) continue;
    hits.push({
      x: target.x,
      y: target.y,
      revealAt: (Math.sqrt(distanceSq) / maxRadius) * 820,
    });
  }

  if (hits.length <= maxHits) return hits;

  hits.sort((a, b) => a.revealAt - b.revealAt);
  const reduced = [];
  const stride = hits.length / maxHits;
  for (let i = 0; i < maxHits; i += 1) {
    reduced.push(hits[Math.floor(i * stride)]);
  }
  return reduced;
}

function mergeRevealedRipplePoints(current, hits, limit, now, ttlMs = null) {
  const seen = new Set(current.map((point) => `${point.x},${point.y}`));
  const merged = [...current];
  for (const hit of hits) {
    const key = `${hit.x},${hit.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      x: hit.x,
      y: hit.y,
      expiresAt: ttlMs ? now + hit.revealAt + ttlMs : null,
    });
  }
  return merged.slice(-limit);
}

function handleBoardPointerDown(event) {
  if (state.level.mode === 'ripple') {
    triggerRipple(boardPointFromEvent(event));
  }
  if (state.level.mode === 'radialWave') {
    triggerRadialWave(boardPointFromEvent(event));
  }
}

function updateAudioAt(point) {
  if (state.level.mode !== 'sonarPoint') return;
  ensureAudio();
  const hit = state.matrix[point.y]?.[point.x];
  audioState.osc.frequency.setTargetAtTime(hit ? 920 : 180, audioState.ctx.currentTime, 0.015);
  audioState.gain.gain.setTargetAtTime(0.08, audioState.ctx.currentTime, 0.015);
}

const audioState = {
  ctx: null,
  osc: null,
  gain: null,
};

function ensureAudio() {
  if (audioState.ctx) return;
  audioState.ctx = new AudioContext();
  audioState.osc = audioState.ctx.createOscillator();
  audioState.gain = audioState.ctx.createGain();
  audioState.osc.type = 'sine';
  audioState.gain.gain.value = 0;
  audioState.osc.connect(audioState.gain);
  audioState.gain.connect(audioState.ctx.destination);
  audioState.osc.start();
}

const actions = {
  loadLevel,
  setProbe,
  moveProbe,
  recordScan,
  undoScan,
  clearScans,
  resetLevel,
  startDrag(which) {
    state.dragging = which;
  },
  stopDrag() {
    state.dragging = null;
  },
};

ui = createUiController(elements, levels, actions);
ui.initLevelButtons();

createInputController({
  canvas: elements.canvas,
  boardSize: BOARD_SIZE,
  getState: () => buildView(),
  actions,
});

document.querySelector('#scanButton').addEventListener('click', recordScan);
document.querySelector('#fireButton').addEventListener('click', recordScan);
document.querySelector('#undoScanButton').addEventListener('click', undoScan);
document.querySelector('#clearScansButton').addEventListener('click', clearScans);
document.querySelector('#resetButton').addEventListener('click', resetLevel);
document.querySelector('#gridButton').addEventListener('click', () => {
  state.showGrid = !state.showGrid;
  render();
});
document.querySelector('#radiusSlider').addEventListener('input', (event) => {
  state.radar.radius = Number(event.target.value);
  renderAndSchedule();
});
document.querySelector('#speedSlider').addEventListener('input', (event) => {
  const t = Number(event.target.value) / 100;
  const secondsPerTurn = 20 - Math.pow(t, 1.8) * 19;
  state.radar.speed = 1 / secondsPerTurn;
  renderAndSchedule();
});
elements.showAnswerToggle.addEventListener('change', (event) => toggleAnswer(event.target.checked));
document.querySelector('#submitButton').addEventListener('click', submitAnswer);
elements.answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitAnswer();
});
elements.canvas.addEventListener('pointerdown', handleBoardPointerDown);
elements.canvas.addEventListener('pointermove', (event) => {
  if (event.buttons !== 1) return;
  updateAudioAt(boardPointFromEvent(event));
});
elements.canvas.addEventListener('pointerup', () => {
  if (audioState.gain) audioState.gain.gain.setTargetAtTime(0, audioState.ctx.currentTime, 0.03);
});

loadLevel(0);
function tick(now) {
  animationFrame = null;
  render(now);
  if (needsAnimation()) requestRenderLoop();
}
