import { EVENT_LOG_LIMIT } from '../config.js';
import { escapeHtml, formatNumber, nowLabel } from '../core/format.js';

export class LogPanel {
  #dialog;
  #entries = [];

  constructor(dialog) {
    this.#dialog = dialog;
    document.getElementById('closeLogsButton').addEventListener('click', () => this.#dialog.close());
  }

  open() {
    this.#dialog.showModal();
  }

  add(message) {
    this.#entries.unshift(`${nowLabel()} · ${message}`);
    this.#entries = this.#entries.slice(0, EVENT_LOG_LIMIT);
    document.getElementById('eventLog').innerHTML = this.#entries.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('');
  }

  renderTelemetry(raw, screen, speed) {
    document.getElementById('rawAlpha').textContent = formatNumber(raw.alpha);
    document.getElementById('rawBeta').textContent = formatNumber(raw.beta);
    document.getElementById('rawGamma').textContent = formatNumber(raw.gamma);
    document.getElementById('screenRateX').textContent = formatNumber(screen.x);
    document.getElementById('screenRateY').textContent = formatNumber(screen.y);
    document.getElementById('planarSpeed').textContent = formatNumber(speed);
  }
}
