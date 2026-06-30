import { clampPoint } from './scanEngine.js';

export function createInputController({ canvas, boardSize, getState, actions }) {
  function pointerToBoard(event) {
    const rect = canvas.getBoundingClientRect();
    return clampPoint({
      x: ((event.clientX - rect.left) / rect.width) * boardSize,
      y: ((event.clientY - rect.top) / rect.height) * boardSize,
    }, boardSize, boardSize);
  }

  function nearestProbe(point) {
    const state = getState();
    if (['sonarPoint', 'ripple', 'radialWave'].includes(state.level.mode)) return null;
    if (state.level.mode === 'radar') return 'a';
    const da = Math.hypot(point.x - state.a.x, point.y - state.a.y);
    const db = Math.hypot(point.x - state.b.x, point.y - state.b.y);
    if (state.level.mode === 'fixed') return 'b';
    return da < db ? 'a' : 'b';
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = pointerToBoard(event);
    const probe = nearestProbe(point);
    if (probe) actions.startDrag(probe);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    const state = getState();
    if (!state.dragging) return;
    actions.setProbe(state.dragging, pointerToBoard(event));
  });

  canvas.addEventListener('pointerup', () => {
    actions.stopDrag();
  });

  document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const speed = event.shiftKey ? 8 : 2;
    const key = event.key.toLowerCase();
    let handled = true;

    if (key === 'w') actions.moveProbe('a', 0, -speed);
    else if (key === 's') actions.moveProbe('a', 0, speed);
    else if (key === 'a') actions.moveProbe('a', -speed, 0);
    else if (key === 'd') actions.moveProbe('a', speed, 0);
    else if (event.key === 'ArrowUp' && getState().level.mode !== 'radar') actions.moveProbe('b', 0, -speed);
    else if (event.key === 'ArrowDown' && getState().level.mode !== 'radar') actions.moveProbe('b', 0, speed);
    else if (event.key === 'ArrowLeft' && getState().level.mode !== 'radar') actions.moveProbe('b', -speed, 0);
    else if (event.key === 'ArrowRight' && getState().level.mode !== 'radar') actions.moveProbe('b', speed, 0);
    else if (key === 'enter') actions.recordScan();
    else if (key === 'r') actions.resetLevel();
    else handled = false;

    if (handled) event.preventDefault();
  });
}
