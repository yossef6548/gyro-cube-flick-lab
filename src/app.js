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
const motion = new MotionController(settingsPanel.getSettings(), () => cube.getCubeAxes());

initialize();

function initialize() {
  renderAxisGuide(cube.getCubeAxes());
  bindUi();
  bindMotion();
  bindCube();
  logs.add('Loaded container-axis flick lab. Hold the phone as if it physically contains the cube.');
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

  for (const button of document.querySelectorAll('[data-manual-axis]')) {
    button.addEventListener('click', () => {
      const axis = button.dataset.manualAxis;
      const direction = Number(button.dataset.manualDirection);
      const candidate = motion.detectManualSnap(axis, direction);
      performSnap(candidate, `Manual ${axis.toUpperCase()}${direction > 0 ? '+' : '−'}`);
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
    logs.renderTelemetry(event.detail.raw, event.detail.container, event.detail.speed);
  });

  motion.addEventListener('flick', (event) => {
    performSnap(event.detail, `Flick ${formatNumber(event.detail.speed)}°/s`);
  });
}

function bindCube() {
  cube.addEventListener('change', (event) => {
    renderAxisGuide(event.detail.cubeAxes);
  });
}

function performSnap(flick, sourceLabel) {
  const move = cube.snap(flick.axis, flick.direction);
  elements.lastMoveStatus.textContent = `Last snap: ${move.label}`;
  logs.add(
    `${move.label} · ${sourceLabel} · confidence ${formatNumber(flick.confidence, 2)} · current-local-axis snap #${move.moveCount}`,
  );

  if (settingsPanel.getSettings().vibrationEnabled && navigator.vibrate && sourceLabel.startsWith('Flick')) {
    navigator.vibrate(18);
  }
}
