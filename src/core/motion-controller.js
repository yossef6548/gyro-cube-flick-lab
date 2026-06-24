import { selectProjectedAxis } from './flick-detector.js';
import { length2 } from './vector.js';

const ZERO_RAW = Object.freeze({ alpha: 0, beta: 0, gamma: 0 });

export class MotionController extends EventTarget {
  #settings;
  #getProjectedAxes;
  #enabled = false;
  #touchActive = false;
  #smoothedRaw = { ...ZERO_RAW };
  #cooldownUntil = 0;
  #waitingForNeutral = false;
  #stableSince = performance.now();
  #boundMotionHandler = this.#handleMotion.bind(this);

  constructor(settings, getProjectedAxes) {
    super();
    this.#settings = settings;
    this.#getProjectedAxes = getProjectedAxes;
  }

  updateSettings(settings) {
    this.#settings = settings;
  }

  setTouchActive(isActive) {
    this.#touchActive = isActive;
  }

  async enable() {
    if (!('DeviceMotionEvent' in window)) {
      this.#emitStatus('Motion API is not available in this browser.', 'error');
      return false;
    }

    try {
      const requestPermission = window.DeviceMotionEvent?.requestPermission;
      if (typeof requestPermission === 'function') {
        const permission = await requestPermission.call(window.DeviceMotionEvent);
        if (permission !== 'granted') {
          this.#emitStatus('Motion permission was not granted.', 'error');
          return false;
        }
      }

      window.removeEventListener('devicemotion', this.#boundMotionHandler);
      window.addEventListener('devicemotion', this.#boundMotionHandler, { passive: true });
      this.#enabled = true;
      this.rearm();
      this.#emitStatus('Motion enabled', 'ready');
      return true;
    } catch (error) {
      this.#emitStatus(`Motion permission failed: ${error.message}`, 'error');
      return false;
    }
  }

  rearm() {
    this.#cooldownUntil = 0;
    this.#waitingForNeutral = false;
    this.#stableSince = performance.now();
    this.#emitArmedState('Armed');
  }

  detectManualVector(vector) {
    return selectProjectedAxis(vector, this.#getProjectedAxes(), this.#settings);
  }

  #handleMotion(event) {
    const now = performance.now();
    const raw = normalizeRotationRate(event.rotationRate);
    this.#smoothedRaw = smoothRates(this.#smoothedRaw, raw, this.#settings.smoothing);
    const screen = mapRawToScreen(this.#smoothedRaw, this.#settings.sensorMap);
    const speed = length2(screen);

    this.dispatchEvent(
      new CustomEvent('telemetry', {
        detail: {
          raw: this.#smoothedRaw,
          screen,
          speed,
          projectedAxes: this.#getProjectedAxes(),
        },
      }),
    );

    if (!this.#enabled) return;

    if (this.#settings.ignoreWhileTouching && this.#touchActive) {
      this.#emitArmedState('Touch lock');
      return;
    }

    if (speed < this.#settings.neutralThreshold) {
      if (this.#waitingForNeutral && now - this.#stableSince >= this.#settings.neutralDurationMs) {
        this.#waitingForNeutral = false;
      }
      this.#emitArmedState('Armed');
    } else if (!this.#waitingForNeutral) {
      this.#stableSince = now;
    }

    if (now < this.#cooldownUntil) {
      this.#emitArmedState('Cooldown');
      return;
    }

    if (this.#settings.requireNeutral && this.#waitingForNeutral) {
      this.#emitArmedState('Return to neutral');
      return;
    }

    const flick = selectProjectedAxis(screen, this.#getProjectedAxes(), this.#settings);
    if (!flick) return;

    this.#cooldownUntil = now + this.#settings.cooldownMs;
    this.#waitingForNeutral = this.#settings.requireNeutral;
    this.#stableSince = now;

    this.dispatchEvent(new CustomEvent('flick', { detail: flick }));
  }

  #emitStatus(message, tone) {
    this.dispatchEvent(new CustomEvent('status', { detail: { message, tone } }));
  }

  #emitArmedState(label) {
    this.dispatchEvent(new CustomEvent('armed-state', { detail: { label } }));
  }
}

function normalizeRotationRate(rotationRate) {
  if (!rotationRate) return { ...ZERO_RAW };

  return {
    alpha: finiteNumber(rotationRate.alpha),
    beta: finiteNumber(rotationRate.beta),
    gamma: finiteNumber(rotationRate.gamma),
  };
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function smoothRates(previous, next, smoothing) {
  const retention = Number(smoothing);
  const inputWeight = 1 - retention;

  return {
    alpha: previous.alpha * retention + next.alpha * inputWeight,
    beta: previous.beta * retention + next.beta * inputWeight,
    gamma: previous.gamma * retention + next.gamma * inputWeight,
  };
}

function mapRawToScreen(raw, sensorMap) {
  return {
    x: raw[sensorMap.screenX.source] * sensorMap.screenX.sign,
    y: raw[sensorMap.screenY.source] * sensorMap.screenY.sign,
  };
}
