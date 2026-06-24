import { CubeOrientation } from './core/cube-orientation.js';
import { MotionController } from './core/motion-controller.js';
import { formatNumber } from './core/format.js';
import { SettingsPanel } from './ui/settings-panel.js';
import { LogPanel } from './ui/log-panel.js';
import { renderAxisGuide } from './ui/axis-guide.js';

const scene = document.getElementById('scene');
const cubeElement = document.getElementById('cube');
const enableMotionButton = document.getElementById('enableMotionButton');
const settingsButton = document.getElementById('settingsButton');
const logsButton = document.getElementById('logsButton');
const resetButton = document.getElementById('resetButton');
const motionStatus = document.getElementById('motionStatus');
const armedStatus = document.getElementById('armedStatus');
const lastMoveStatus = document.getElementById('lastMoveStatus');
const settingsDialog = document.getElementById('settingsDialog');
const settingsForm = document.getElementById('settingsForm');
const logsDialog = document.getElementById('logsDialog');

const settingsPanel = new SettingsPanel(settingsDialog, settingsForm);
const cube = new CubeOrientation(cubeElement);
const logs = new LogPanel(logsDialog);
const motion = new MotionController(settingsPanel.getSettings(), () => cube.getCubeAxes());

renderAxisGuide(cube.getCubeAxes());
logs.add('Loaded container-axis flick lab. Hold the phone as if it physically contains the cube.');

settingsButton.addEventListener('click', () => settingsPanel.open());
logsButton.addEventListener('click', () => logs.open());

resetButton.addEventListener('click', () => {
  cube.reset();
  lastMoveStatus.textContent = 'Last snap: —';
  logs.add('Cube reset to equal three-face orientation.');
});

enableMotionButton.addEventListener('click', async () => {
  const enabled = await motion.enable();
  if (enabled) {
    enableMotionButton.textContent = 'Motion enabled';
    enableMotionButton.setAttribute('aria-pressed', 'true');
  }
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
    performSnap(candidate, `Manual ${axis.toUpperCase()}${direction > 0 ? '+' : '-'}`);
  });
}

scene.addEventListener('pointerdown', () => motion.setTouchActive(true));
scene.addEventListener('pointerup', () => motion.setTouchActive(false));
scene.addEventListener('pointercancel', () => motion.setTouchActive(false));
scene.addEventListener('pointerleave', () => motion.setTouchActive(false));

motion.addEventListener('status', (event) => {
  motionStatus.textContent = event.detail.message;
  logs.add(event.detail.message);
});

motion.addEventListener('armed-state', (event) => {
  armedStatus.textContent = event.detail.label;
});

motion.addEventListener('telemetry', (event) => {
  logs.renderTelemetry(event.detail.raw, event.detail.container, event.detail.speed);
});

motion.addEventListener('flick', (event) => {
  performSnap(event.detail, `Flick ${formatNumber(event.detail.speed)} deg/s`);
});

cube.addEventListener('change', (event) => {
  renderAxisGuide(event.detail.cubeAxes);
});

function performSnap(flick, sourceLabel) {
  const move = cube.snap(flick.axis, flick.direction);
  lastMoveStatus.textContent = `Last snap: ${move.label}`;
  logs.add(`${move.label} · ${sourceLabel} · confidence ${formatNumber(flick.confidence, 2)} · snap #${move.moveCount}`);
}
