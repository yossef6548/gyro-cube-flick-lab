import { clearSettings, saveSettings, structuredDefaults } from './storage.js';
import { formatNumber } from './utils.js';

const FIELD_IDS = Object.freeze({
  velocityThreshold: 'thresholdInput',
  dominanceRatio: 'dominanceInput',
  cooldownMs: 'cooldownInput',
  neutralThreshold: 'neutralThresholdInput',
  neutralDurationMs: 'neutralDurationInput',
  smoothing: 'smoothingInput',
  requireNeutral: 'requireNeutralInput',
  ignoreWhileTouching: 'ignoreTouchInput',
  vibrationEnabled: 'vibrationInput',
});

const OUTPUT_IDS = Object.freeze({
  velocityThreshold: 'thresholdOutput',
  dominanceRatio: 'dominanceOutput',
  cooldownMs: 'cooldownOutput',
  neutralThreshold: 'neutralThresholdOutput',
  neutralDurationMs: 'neutralDurationOutput',
  smoothing: 'smoothingOutput',
});

export class SettingsPanel extends EventTarget {
  #dialog;
  #form;
  #settings;

  constructor(dialog, form, settings) {
    super();
    this.#dialog = dialog;
    this.#form = form;
    this.#settings = settings;
    this.#bindEvents();
    this.#writeSettingsToForm();
  }

  open() {
    this.#writeSettingsToForm();
    if (typeof this.#dialog.showModal === 'function') {
      this.#dialog.showModal();
    } else {
      this.#dialog.setAttribute('open', '');
    }
  }

  getSettings() {
    return this.#settings;
  }

  #bindEvents() {
    this.#form.addEventListener('input', () => {
      this.#settings = this.#readSettingsFromForm();
      saveSettings(this.#settings);
      this.#updateOutputs();
      this.dispatchEvent(new CustomEvent('change', { detail: { settings: this.#settings } }));
    });

    document.getElementById('resetSettingsButton').addEventListener('click', () => {
      clearSettings();
      this.#settings = structuredDefaults();
      this.#writeSettingsToForm();
      saveSettings(this.#settings);
      this.dispatchEvent(new CustomEvent('change', { detail: { settings: this.#settings } }));
    });
  }

  #writeSettingsToForm() {
    for (const [key, id] of Object.entries(FIELD_IDS)) {
      const input = document.getElementById(id);
      if (input.type === 'checkbox') {
        input.checked = Boolean(this.#settings[key]);
      } else {
        input.value = this.#settings[key];
      }
    }

    for (const axis of ['x', 'y', 'z']) {
      document.getElementById(`axis${axis.toUpperCase()}Source`).value = this.#settings.axisMap[axis].source;
      document.getElementById(`axis${axis.toUpperCase()}Sign`).value = String(this.#settings.axisMap[axis].sign);
    }

    this.#updateOutputs();
  }

  #readSettingsFromForm() {
    return {
      velocityThreshold: Number(document.getElementById(FIELD_IDS.velocityThreshold).value),
      dominanceRatio: Number(document.getElementById(FIELD_IDS.dominanceRatio).value),
      cooldownMs: Number(document.getElementById(FIELD_IDS.cooldownMs).value),
      neutralThreshold: Number(document.getElementById(FIELD_IDS.neutralThreshold).value),
      neutralDurationMs: Number(document.getElementById(FIELD_IDS.neutralDurationMs).value),
      smoothing: Number(document.getElementById(FIELD_IDS.smoothing).value),
      requireNeutral: document.getElementById(FIELD_IDS.requireNeutral).checked,
      ignoreWhileTouching: document.getElementById(FIELD_IDS.ignoreWhileTouching).checked,
      vibrationEnabled: document.getElementById(FIELD_IDS.vibrationEnabled).checked,
      axisMap: {
        x: readAxisRow('X'),
        y: readAxisRow('Y'),
        z: readAxisRow('Z'),
      },
    };
  }

  #updateOutputs() {
    const outputMap = {
      velocityThreshold: `${formatNumber(this.#settings.velocityThreshold)}°/s`,
      dominanceRatio: `${formatNumber(this.#settings.dominanceRatio, 1)}×`,
      cooldownMs: `${formatNumber(this.#settings.cooldownMs)}ms`,
      neutralThreshold: `${formatNumber(this.#settings.neutralThreshold)}°/s`,
      neutralDurationMs: `${formatNumber(this.#settings.neutralDurationMs)}ms`,
      smoothing: formatNumber(this.#settings.smoothing, 2),
    };

    for (const [key, id] of Object.entries(OUTPUT_IDS)) {
      document.getElementById(id).textContent = outputMap[key];
    }
  }
}

function readAxisRow(axisLetter) {
  return {
    source: document.getElementById(`axis${axisLetter}Source`).value,
    sign: Number(document.getElementById(`axis${axisLetter}Sign`).value),
  };
}
