import { DEFAULT_SETTINGS, SETTING_UNITS } from '../config.js';
import { loadSettings, resetStoredSettings, saveSettings } from '../core/storage.js';
import { formatNumber } from '../core/format.js';

const NUMBER_INPUTS = Object.freeze([
  'planarThreshold',
  'projectionConfidence',
  'cooldownMs',
  'neutralThreshold',
  'neutralDurationMs',
  'smoothing',
]);

export class SettingsPanel extends EventTarget {
  #dialog;
  #form;
  #settings;

  constructor(dialog, form) {
    super();
    this.#dialog = dialog;
    this.#form = form;
    this.#settings = loadSettings();
    this.#bindEvents();
    this.#render();
  }

  open() {
    this.#dialog.showModal();
  }

  getSettings() {
    return structuredClone(this.#settings);
  }

  #bindEvents() {
    this.#form.addEventListener('input', () => this.#applyFromForm());
    this.#form.addEventListener('change', () => this.#applyFromForm());

    document.getElementById('resetSettingsButton').addEventListener('click', () => {
      this.#settings = resetStoredSettings();
      this.#render();
      this.#emitChange();
    });
  }

  #applyFromForm() {
    const data = new FormData(this.#form);
    const next = structuredClone(this.#settings);

    for (const name of NUMBER_INPUTS) {
      next[name] = Number(data.get(name));
    }

    next.requireNeutral = data.get('requireNeutral') === 'on';
    next.ignoreWhileTouching = data.get('ignoreWhileTouching') === 'on';
    next.vibrationEnabled = data.get('vibrationEnabled') === 'on';
    next.sensorMap = {
      screenX: {
        source: String(data.get('screenXSource')),
        sign: Number(data.get('screenXSign')),
      },
      screenY: {
        source: String(data.get('screenYSource')),
        sign: Number(data.get('screenYSign')),
      },
    };

    this.#settings = next;
    saveSettings(next);
    this.#renderOutputs();
    this.#emitChange();
  }

  #render() {
    for (const name of NUMBER_INPUTS) {
      this.#form.elements[name].value = this.#settings[name];
    }

    this.#form.elements.requireNeutral.checked = this.#settings.requireNeutral;
    this.#form.elements.ignoreWhileTouching.checked = this.#settings.ignoreWhileTouching;
    this.#form.elements.vibrationEnabled.checked = this.#settings.vibrationEnabled;
    this.#form.elements.screenXSource.value = this.#settings.sensorMap.screenX.source;
    this.#form.elements.screenXSign.value = String(this.#settings.sensorMap.screenX.sign);
    this.#form.elements.screenYSource.value = this.#settings.sensorMap.screenY.source;
    this.#form.elements.screenYSign.value = String(this.#settings.sensorMap.screenY.sign);
    this.#renderOutputs();
  }

  #renderOutputs() {
    setOutput('planarThresholdOutput', this.#settings.planarThreshold, 0, SETTING_UNITS.planarThreshold);
    setOutput(
      'projectionConfidenceOutput',
      this.#settings.projectionConfidence,
      2,
      SETTING_UNITS.projectionConfidence,
    );
    setOutput('cooldownOutput', this.#settings.cooldownMs, 0, SETTING_UNITS.cooldownMs);
    setOutput('neutralThresholdOutput', this.#settings.neutralThreshold, 0, SETTING_UNITS.neutralThreshold);
    setOutput('neutralDurationOutput', this.#settings.neutralDurationMs, 0, SETTING_UNITS.neutralDurationMs);
    setOutput('smoothingOutput', this.#settings.smoothing, 2, SETTING_UNITS.smoothing);
  }

  #emitChange() {
    this.dispatchEvent(new CustomEvent('change', { detail: { settings: this.getSettings() } }));
  }
}

function setOutput(id, value, fractionDigits, unit) {
  document.getElementById(id).textContent = `${formatNumber(value, fractionDigits)}${unit ? ` ${unit}` : ''}`;
}
