import { CubeOrientation } from './core/cube-orientation.js';
import { MotionController } from './core/motion-controller.js';
import { formatNumber } from './core/format.js';
import { SettingsPanel } from './ui/settings-panel.js';
import { LogPanel } from './ui/log-panel.js';
import { renderAxisGuide } from './ui/axis-guide.js';

const elements = {
  scene: document.getElementById('scene'),
  cube: document.getElementById('cube'),
  enableMotionButton: document.getElementById('enableMotionButton'),
  settingsButton: document.getElementById('settingsButton'),
  logsButton: document.getElementById('logsButton'),
  resetButton: document.getElementById('resetButton'),
  motionStatus: document.getElementById('motionStatus'),
  armedStatus: document.getElementById('armedStatus'),
  lastMoveStatus: document.getElementById('lastMoveStatus'),
  settingsDialog: document.getElementById('settingsDialog'),
  settingsForm: document.getElementById('settingsForm'),
  logsDialog: document.getElementById('logsDialog'),
};

const settingsPanel = new SettingsPanel(elements.settingsDialog, elements.settingsForm);
const cube = new CubeOrientation(elements.cube);
const logs = new LogPanel(elements.logsDialog);
const motion = new MotionController(settingsPanel.getSettings(), () => cube.getProjectedAxes());

initialize();

function initialize() {
  renderAxisGuide(cube.getProjectedAxes());
  bindUi();
  bindMotion();
  bindCube();
  logs.add('Loaded landscape-first flick lab.');
}

function bindUi() {
  elements.settingsButton.addEventListener('click', () => settingsPanel.open());
  elements.logsButton.addEventListener('click', () => logs.open());

  elements.enableMotionButton.addEventListener('click', async () => {
    const enabled = await motion.enable();
    if (enabled) {
      elements.enableMotionButton.textContent = 'Motion enabled';
      elements.enableMotionButton.setAttribute('aria-pressed', 'true');
    }
  });

  elements.resetButton.addEventListener('click', () => {
    cube.reset();
    elements.lastMoveStatus.textContent = 'Last snap: —';
    logs.add('Cube reset to equal three-face orientation.');
  });

  settingsPanel.addEventListener('change', (event) => {
    motion.updateSettings(event.detail.settings);
    logs.add('Settings updated.');
  });

  for (const button of document.querySelectorAll('[data-manual-vector]')) {
    button.addEventListener('click', () => {
      const vector = parseManualVector(button.dataset.manualVector);
      const candidate = motion.detectManualVector(vector);
      if (!candidate) {
        logs.add(`Manual ${button.textContent.trim()} did not match a projected cube axis.`);
        return;
      }
      performSnap(candidate, `Manual ${button.textContent.trim()}`);
    });
  }

  elements.scene.addEventListener('pointerdown', () => motion.setTouchActive(true));
  elements.scene.addEventListener('pointerup', () => motion.setTouchActive(false));
  elements.scene.addEventListener('pointercancel', () => motion.setTouchActive(false));
  elements.scene.addEventListener('pointerleave', () => motion.setTouchActive(false));
}

function bindMotion() {
  motion.addEventListener('status', (event) => {
    elements.motionStatus.textContent = event.detail.message;
    logs.add(event.detail.message);
  });

  motion.addEventListener('armed-state', (event) => {
    elements.armedStatus.textContent = event.detail.label;
  });

  motion.addEventListener('telemetry', (event) => {
    logs.renderTelemetry(event.detail.raw, event.detail.screen, event.detail.speed);
  });

  motion.addEventListener('flick', (event) => {
    performSnap(event.detail, `Flick ${formatNumber(event.detail.speed)}°/s`);
  });
}

function bindCube() {
  cube.addEventListener('change', (event) => {
    renderAxisGuide(event.detail.projectedAxes);
  });
}

function performSnap(flick, sourceLabel) {
  const move = cube.snap(flick.axis, flick.direction);
  elements.lastMoveStatus.textContent = `Last snap: ${move.label}`;
  logs.add(
    `${move.label} · ${sourceLabel} · confidence ${formatNumber(flick.confidence, 2)} · local-axis snap #${move.moveCount}`,
  );

  if (settingsPanel.getSettings().vibrationEnabled && navigator.vibrate && sourceLabel.startsWith('Flick')) {
    navigator.vibrate(18);
  }
}

function parseManualVector(value) {
  const [x, y] = value.split(',').map(Number);
  return { x: x * 1000, y: y * 1000 };
}
