import { EVENT_LOG_LIMIT } from './config.js';
import { CubeView } from './cube-view.js';
import { MotionController } from './motion-controller.js';
import { SettingsPanel } from './settings-panel.js';
import { loadSettings, saveSettings } from './storage.js';
import { axisLabel, formatNumber, meterScale, nowLabel } from './utils.js';

const elements = {
  cube: document.getElementById('cube'),
  cubeStage: document.getElementById('cubeStage'),
  enableMotionButton: document.getElementById('enableMotionButton'),
  openSettingsButton: document.getElementById('openSettingsButton'),
  resetCubeButton: document.getElementById('resetCubeButton'),
  calibrateButton: document.getElementById('calibrateButton'),
  motionStatus: document.getElementById('motionStatus'),
  armedStatus: document.getElementById('armedStatus'),
  lastFlickStatus: document.getElementById('lastFlickStatus'),
  eventLog: document.getElementById('eventLog'),
  rawAlpha: document.getElementById('rawAlpha'),
  rawBeta: document.getElementById('rawBeta'),
  rawGamma: document.getElementById('rawGamma'),
  rateX: document.getElementById('rateX'),
  rateY: document.getElementById('rateY'),
  rateZ: document.getElementById('rateZ'),
  meterX: document.getElementById('meterX'),
  meterY: document.getElementById('meterY'),
  meterZ: document.getElementById('meterZ'),
  settingsDialog: document.getElementById('settingsDialog'),
  settingsForm: document.getElementById('settingsForm'),
};

const state = {
  eventLog: [],
};

const settings = loadSettings();
saveSettings(settings);

const cubeView = new CubeView(elements.cube);
const motionController = new MotionController(settings);
const settingsPanel = new SettingsPanel(elements.settingsDialog, elements.settingsForm, settings);

bindUiEvents();
bindMotionEvents();
renderTelemetry({ alpha: 0, beta: 0, gamma: 0 }, { x: 0, y: 0, z: 0 });
addLogEntry('Lab loaded. Use HTTPS on iPhone Safari, then press Enable motion.');

function bindUiEvents() {
  elements.enableMotionButton.addEventListener('click', async () => {
    elements.enableMotionButton.disabled = true;
    setMotionStatus('Requesting motion permission…', 'waiting');
    const enabled = await motionController.enable();
    elements.enableMotionButton.disabled = false;
    if (enabled) {
      elements.enableMotionButton.textContent = 'Motion enabled';
    }
  });

  elements.openSettingsButton.addEventListener('click', () => settingsPanel.open());

  elements.resetCubeButton.addEventListener('click', () => {
    cubeView.reset();
    elements.lastFlickStatus.textContent = 'Last flick: —';
    addLogEntry('Cube orientation reset.');
  });

  elements.calibrateButton.addEventListener('click', () => {
    motionController.rearm();
    addLogEntry('Detector re-armed manually.');
  });

  for (const button of document.querySelectorAll('[data-manual-flick]')) {
    button.addEventListener('click', () => {
      const [axis, directionText] = button.dataset.manualFlick.split(':');
      performSnap({ axis, direction: Number(directionText), speed: 0, ratio: 0 }, true);
    });
  }

  elements.cubeStage.addEventListener('pointerdown', () => motionController.setTouchActive(true));
  elements.cubeStage.addEventListener('pointerup', () => motionController.setTouchActive(false));
  elements.cubeStage.addEventListener('pointercancel', () => motionController.setTouchActive(false));
  elements.cubeStage.addEventListener('pointerleave', () => motionController.setTouchActive(false));

  settingsPanel.addEventListener('change', (event) => {
    motionController.updateSettings(event.detail.settings);
    addLogEntry('Settings updated.');
  });
}

function bindMotionEvents() {
  motionController.addEventListener('status', (event) => {
    setMotionStatus(event.detail.message, event.detail.tone);
    addLogEntry(event.detail.message);
  });

  motionController.addEventListener('telemetry', (event) => {
    renderTelemetry(event.detail.raw, event.detail.mapped);
  });

  motionController.addEventListener('armed-state', (event) => {
    elements.armedStatus.textContent = event.detail.label;
  });

  motionController.addEventListener('flick', (event) => {
    performSnap(event.detail, false);
  });
}

function performSnap(flick, isManual) {
  const move = cubeView.snap(flick.axis, flick.direction);
  const moveLabel = axisLabel(move.axis, move.direction);
  const source = isManual ? 'Manual' : `Flick ${formatNumber(flick.speed)}°/s, ${formatNumber(flick.ratio, 1)}×`;

  elements.lastFlickStatus.textContent = `Last flick: ${moveLabel}`;
  addLogEntry(`${moveLabel} snap · ${source}`);

  const currentSettings = settingsPanel.getSettings();
  if (currentSettings.vibrationEnabled && navigator.vibrate && !isManual) {
    navigator.vibrate(18);
  }
}

function setMotionStatus(message, tone = 'idle') {
  elements.motionStatus.textContent = message;
  elements.motionStatus.className = `status-pill status-${tone}`;
}

function renderTelemetry(raw, mapped) {
  elements.rawAlpha.textContent = formatNumber(raw.alpha);
  elements.rawBeta.textContent = formatNumber(raw.beta);
  elements.rawGamma.textContent = formatNumber(raw.gamma);

  for (const axis of ['x', 'y', 'z']) {
    const value = mapped[axis];
    document.getElementById(`rate${axis.toUpperCase()}`).textContent = formatNumber(value);
    document.getElementById(`meter${axis.toUpperCase()}`).style.transform = `scaleX(${meterScale(value)})`;
  }
}

function addLogEntry(message) {
  state.eventLog.unshift(`${nowLabel()} · ${message}`);
  state.eventLog = state.eventLog.slice(0, EVENT_LOG_LIMIT);
  elements.eventLog.innerHTML = state.eventLog.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('');
}

function escapeHtml(value) {
  const wrapper = document.createElement('span');
  wrapper.textContent = value;
  return wrapper.innerHTML;
}
