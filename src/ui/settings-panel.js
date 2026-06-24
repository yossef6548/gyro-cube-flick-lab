import { DEFAULT_SETTINGS, SETTING_UNITS } from '../config.js';
import { loadSettings, resetStoredSettings, saveSettings } from '../core/storage.js';
import { formatNumber } from '../core/format.js';

const NUMBER_INPUTS = Object.freeze([
  'spinThreshold',
  'axisConfidence',
  'cooldownMs',
  'neutralThreshold',
  'neutralDurationMs',
  'smoothing',
]);

const CONTAINER_AXES = Object.freeze(['containerX', 'containerY', 'containerZ']);
const CUBE_AXES = Object.freeze(['x', 'y', 'z']);

export class SettingsPanel extends EventTarget {
  #dialog;
  #form;
  #settings;

  constructor(dialog, form) {
    super();
    this.#dialog = dialog;
    this.#form = form;
    this.#ensureAxisDirectionControls();
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
    next.sensorMap = Object.fromEntries(
      CONTAINER_AXES.map((axisName) => [
        axisName,
        {
          source: String(data.get(`${axisName}Source`)),
          sign: Number(data.get(`${axisName}Sign`)),
        },
      ]),
    );
    next.axisDirectionSigns = Object.fromEntries(
      CUBE_AXES.map((axisName) => [axisName, Number(data.get(`${axisName}DirectionSign`)) || 1]),
    );

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

    for (const axisName of CONTAINER_AXES) {
      const axis = this.#settings.sensorMap[axisName] ?? DEFAULT_SETTINGS.sensorMap[axisName];
      this.#form.elements[`${axisName}Source`].value = axis.source;
      this.#form.elements[`${axisName}Sign`].value = String(axis.sign);
    }

    for (const axisName of CUBE_AXES) {
      const sign = this.#settings.axisDirectionSigns?.[axisName] ?? DEFAULT_SETTINGS.axisDirectionSigns[axisName];
      this.#form.elements[`${axisName}DirectionSign`].value = String(sign);
    }

    this.#renderOutputs();
  }

  #renderOutputs() {
    setOutput('spinThresholdOutput', this.#settings.spinThreshold, 0, SETTING_UNITS.spinThreshold);
    setOutput('axisConfidenceOutput', this.#settings.axisConfidence, 2, SETTING_UNITS.axisConfidence);
    setOutput('cooldownOutput', this.#settings.cooldownMs, 0, SETTING_UNITS.cooldownMs);
    setOutput('neutralThresholdOutput', this.#settings.neutralThreshold, 0, SETTING_UNITS.neutralThreshold);
    setOutput('neutralDurationOutput', this.#settings.neutralDurationMs, 0, SETTING_UNITS.neutralDurationMs);
    setOutput('smoothingOutput', this.#settings.smoothing, 2, SETTING_UNITS.smoothing);
  }

  #ensureAxisDirectionControls() {
    if (this.#form.elements.xDirectionSign) return;

    const section = document.createElement('section');
    section.className = 'axis-settings';
    section.setAttribute('aria-label', 'Cube axis snap direction');
    section.innerHTML = `
      <div class="section-copy">
        <h3>Cube-axis snap direction</h3>
        <p>
          Use this when the detector selects the correct visible cube axis but the snap goes the
          opposite way. This reverses only the final snap direction after axis selection, so it will
          not cause the random mixed-axis behavior that happens when sensor axes are inverted.
        </p>
      </div>
      ${CUBE_AXES.map((axisName) => `
        <div class="axis-row">
          <span>${axisName.toUpperCase()} snap</span>
          <select id="${axisName}DirectionSign" name="${axisName}DirectionSign">
            <option value="1">normal</option>
            <option value="-1">reversed</option>
          </select>
          <span></span>
        </div>
      `).join('')}
    `;

    const footer = this.#form.querySelector('.dialog-footer');
    this.#form.insertBefore(section, footer);
  }

  #emitChange() {
    this.dispatchEvent(new CustomEvent('change', { detail: { settings: this.getSettings() } }));
  }
}

function setOutput(id, value, fractionDigits, unit) {
  document.getElementById(id).textContent = `${formatNumber(value, fractionDigits)}${unit ? ` ${unit}` : ''}`;
}
