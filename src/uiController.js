import { formatStars, getStarRating } from './levelRules.js';
import { formatCombinedMetric } from './metricDisplay.js';

const PRIMARY_PROBE_RULE = '拖动探针：用鼠标拖动红色 A 点和蓝色 B 点，也可以用 WASD 精细移动 A 点。';

export function createUiController(elements, levels, actions) {
  function initLevelButtons() {
    elements.levelButtons.innerHTML = '';
    for (const level of levels) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = level.id;
      button.dataset.level = level.id;
      button.addEventListener('click', () => actions.loadLevel(level.id - 1));
      elements.levelButtons.append(button);
    }
  }

  function update(view) {
    const elapsed = Math.floor((Date.now() - view.startedAt) / 1000);
    const rating = getStarRating(elapsed);
    const solved = view.solved.get(view.level.id);
    if (elements.levelRule) elements.levelRule.hidden = true;
    if (elements.levelNote) {
      elements.levelNote.hidden = !view.level.note;
      elements.levelNote.textContent = view.level.note ?? '';
    }
    if (elements.metricLine) elements.metricLine.textContent = formatCombinedMetric(view.segmentResults, view.level);
    if (elements.rating) elements.rating.textContent = solved ? solved.stars : formatStars(rating);
    if (elements.radarControls) {
      elements.radarControls.hidden = view.level.mode !== 'radar';
    }
    if (elements.modeControls) {
      const recordModes = new Set(['free', 'horizontal', 'dualAnchor']);
      for (const control of elements.modeControls) {
        const type = control.dataset.control;
        control.hidden =
          (type === 'record' && !recordModes.has(view.level.mode)) ||
          (type === 'laser' && view.level.mode !== 'laserGun') ||
          (type === 'probe' && !recordModes.has(view.level.mode));
      }
    }
    if (elements.radiusSlider && view.level.mode === 'radar') {
      elements.radiusSlider.value = String(Math.round(view.radar.radius));
    }
    if (elements.rulesList && view.level.rules) {
      elements.rulesList.innerHTML = '';
      for (const rule of view.level.rules) {
        const item = document.createElement('li');
        if (rule === PRIMARY_PROBE_RULE) {
          const strong = document.createElement('strong');
          strong.textContent = rule;
          item.append(strong);
        } else {
          item.textContent = rule;
        }
        elements.rulesList.append(item);
      }
    }

    for (const button of elements.levelButtons.querySelectorAll('button')) {
      button.classList.toggle('active', Number(button.dataset.level) === view.level.id);
      button.classList.toggle('solved', view.solved.has(Number(button.dataset.level)));
    }

  }

  function setMessage(message) {
    elements.message.textContent = message;
  }

  function resetInputs() {
    elements.answerInput.value = '';
    elements.showAnswerToggle.checked = false;
    setMessage('');
  }

  return { initLevelButtons, update, setMessage, resetInputs };
}
