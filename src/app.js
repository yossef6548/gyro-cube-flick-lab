import { CubeOrientation } from './core/cube-orientation.js';
import { MotionController } from './core/motion-controller.js';
import { formatNumber } from './core/format.js';
import { SettingsPanel } from './ui/settings-panel.js';
import { LogPanel } from './ui/log-panel.js';
import { renderAxisGuide } from './ui/axis-guide.js';

upgradeRuntimeMarkup();

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

function upgradeRuntimeMarkup() {
  upgradeManualDock();
  upgradeSettingsPanel();
  upgradeLogsPanel();
}

function upgradeManualDock() {
  const dock = document.querySelector('.manual-dock');
  if (!dock) return;

  dock.setAttribute('aria-label', 'Manual cube-axis snap controls');
  dock.replaceChildren(
    manualButton('x', -1, 'X−'),
    manualButton('x', 1, 'X+'),
    manualButton('y', -1, 'Y−'),
    manualButton('y', 1, 'Y+'),
    manualButton('z', -1, 'Z−'),
    manualButton('z', 1, 'Z+'),
  );
}

function manualButton(axis, direction, text) {
  const button = document.createElement('button');
  button.className = 'manual-button';
  button.type = 'button';
  button.textContent = text;
  button.dataset.manualAxis = axis;
  button.dataset.manualDirection = String(direction);
  button.setAttribute('aria-label', `Manual ${axis.toUpperCase()} ${direction > 0 ? 'positive' : 'negative'} snap`);
  return button;
}

function upgradeSettingsPanel() {
  const eyebrow = document.querySelector('#settingsDialog .eyebrow');
  if (eyebrow) eyebrow.textContent = 'Container-axis motion lab';

  const settingsGrid = document.querySelector('.settings-grid');
  if (settingsGrid) {
    settingsGrid.replaceChildren(
      rangeSetting('spinThreshold', '3D spin threshold', '80', '900', '10'),
      rangeSetting('axisConfidence', 'Axis confidence', '0.55', '0.98', '0.01'),
      rangeSetting('cooldownMs', 'Cooldown', '100', '1200', '25', 'cooldown'),
      rangeSetting('neutralThreshold', 'Neutral threshold', '10', '180', '5'),
      rangeSetting('neutralDurationMs', 'Neutral duration', '0', '700', '25'),
      rangeSetting('smoothing', 'Smoothing', '0', '0.85', '0.05'),
    );
  }

  const axisSettings = document.querySelector('.axis-settings');
  if (axisSettings) {
    axisSettings.setAttribute('aria-label', 'Container sensor mapping');
    axisSettings.replaceChildren(
      sectionCopy(),
      axisRow('containerX', 'Container X'),
      axisRow('containerY', 'Container Y'),
      axisRow('containerZ', 'Container Z'),
    );
  }
}

function rangeSetting(name, labelText, min, max, step, outputPrefix = name) {
  const label = document.createElement('label');
  label.className = 'range-setting';

  const labelRow = document.createElement('span');
  labelRow.append(document.createTextNode(`${labelText} `));

  const output = document.createElement('output');
  output.id = `${outputPrefix}Output`;
  labelRow.append(output);

  const input = document.createElement('input');
  input.id = `${name}Input`;
  input.name = name;
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = step;

  label.replaceChildren(labelRow, input);
  return label;
}

function sectionCopy() {
  const wrapper = document.createElement('div');
  wrapper.className = 'section-copy';

  const heading = document.createElement('h3');
  heading.textContent = 'Container sensor mapping';

  const copy = document.createElement('p');
  copy.textContent =
    'The phone is treated as the container that holds the cube. The detector builds a 3D spin vector from the phone sensors, then matches that vector against the cube’s current visible local X/Y/Z axes. If a physical direction feels reversed, flip that container axis.';

  wrapper.replaceChildren(heading, copy);
  return wrapper;
}

function axisRow(axisName, labelText) {
  const row = document.createElement('div');
  row.className = 'axis-row';

  const label = document.createElement('span');
  label.textContent = labelText;

  const source = document.createElement('select');
  source.id = `${axisName}Source`;
  source.name = `${axisName}Source`;
  source.append(option('alpha'), option('beta'), option('gamma'));

  const sign = document.createElement('select');
  sign.id = `${axisName}Sign`;
  sign.name = `${axisName}Sign`;
  sign.append(option('1', 'normal'), option('-1', 'inverted'));

  row.replaceChildren(label, source, sign);
  return row;
}

function option(value, text = value) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = text;
  return item;
}

function upgradeLogsPanel() {
  const grid = document.querySelector('.telemetry-grid');
  if (grid) {
    grid.replaceChildren(
      metricCard('Raw alpha', 'rawAlpha'),
      metricCard('Raw beta', 'rawBeta'),
      metricCard('Raw gamma', 'rawGamma'),
      metricCard('Container X', 'containerRateX'),
      metricCard('Container Y', 'containerRateY'),
      metricCard('Container Z', 'containerRateZ'),
      metricCard('3D spin speed', 'spinSpeed'),
    );
  }

  const firstLog = document.querySelector('#eventLog li');
  if (firstLog) firstLog.textContent = 'No events yet. Enable motion and rotate the phone around one of the cube axes.';
}

function metricCard(labelText, valueId) {
  const card = document.createElement('article');
  card.className = 'metric-card';

  const label = document.createElement('span');
  label.textContent = labelText;

  const value = document.createElement('strong');
  value.id = valueId;
  value.textContent = '0';

  const unit = document.createElement('em');
  unit.textContent = 'deg/s';

  card.replaceChildren(label, value, unit);
  return card;
}
