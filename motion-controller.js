import { absMax, secondLargestAbs } from './utils.js';

const ZERO_RATES = Object.freeze({ alpha: 0, beta: 0, gamma: 0 });
const CUBE_AXES = ['x', 'y', 'z'];

export class MotionController extends EventTarget {
  #settings;
  #isEnabled = false;
  #isTouchActive = false;
  #smoothedRaw = { ...ZERO_RATES };
  #cooldownUntil = 0;
  #stableSince = performance.now();
  #waitingForNeutral = false;
  #boundMotionHandler = this.#handleMotion.bind(this);

  constructor(settings) {
    super();
    this.#settings = settings;
  }

  updateSettings(settings) {
    this.#settings = settings;
  }

  setTouchActive(isTouchActive) {
    this.#isTouchActive = isTouchActive;
  }

  async enable() {
    if (!('DeviceMotionEvent' in window)) {
      this.#emitStatus('Motion API is not available in this browser.', 'error');
      return false;
    }

    try {
      const permissionApi = window.DeviceMotionEvent?.requestPermission;
      if (typeof permissionApi === 'function') {
        const permission = await permissionApi.call(window.DeviceMotionEvent);
        if (permission !== 'granted') {
          this.#emitStatus('Motion permission was not granted.', 'error');
          return false;
        }
      }

      window.removeEventListener('devicemotion', this.#boundMotionHandler);
      window.addEventListener('devicemotion', this.#boundMotionHandler, { passive: true });
      this.#isEnabled = true;
      this.rearm();
      this.#emitStatus('Motion enabled. Flick the phone to snap the cube.', 'ready');
      return true;
    } catch (error) {
      this.#emitStatus(`Motion permission failed: ${error.message}`, 'error');
      return false;
    }
  }

  disable() {
    window.removeEventListener('devicemotion', this.#boundMotionHandler);
    this.#isEnabled = false;
    this.#emitStatus('Motion disabled.', 'idle');
  }

  rearm() {
    this.#cooldownUntil = 0;
    this.#waitingForNeutral = false;
    this.#stableSince = performance.now();
    this.dispatchEvent(new CustomEvent('armed-state', { detail: { label: 'Armed' } }));
  }

  #handleMotion(event) {
    const now = performance.now();
    const raw = normalizeRotationRate(event.rotationRate);
    this.#smoothedRaw = smoothRates(this.#smoothedRaw, raw, this.#settings.smoothing);
    const mapped = mapRates(this.#smoothedRaw, this.#settings.axisMap);

    this.dispatchEvent(
      new CustomEvent('telemetry', {
        detail: {
          raw: this.#smoothedRaw,
          mapped,
        },
      }),
    );

    if (!this.#isEnabled) return;
    if (this.#settings.ignoreWhileTouching && this.#isTouchActive) {
      this.dispatchEvent(new CustomEvent('armed-state', { detail: { label: 'Touch lock' } }));
      return;
    }

    const maxRawRate = Math.max(...Object.values(mapped).map(Math.abs));
    if (maxRawRate < this.#settings.neutralThreshold) {
      if (this.#waitingForNeutral && now - this.#stableSince >= this.#settings.neutralDurationMs) {
        this.#waitingForNeutral = false;
      }
      this.dispatchEvent(new CustomEvent('armed-state', { detail: { label: 'Armed' } }));
    } else if (!this.#waitingForNeutral) {
      this.#stableSince = now;
    }

    if (now < this.#cooldownUntil) {
      this.dispatchEvent(new CustomEvent('armed-state', { detail: { label: 'Cooldown' } }));
      return;
    }

    if (this.#settings.requireNeutral && this.#waitingForNeutral) {
      this.dispatchEvent(new CustomEvent('armed-state', { detail: { label: 'Return to neutral' } }));
      return;
    }

    const candidate = detectFlick(mapped, this.#settings);
    if (!candidate) return;

    this.#cooldownUntil = now + this.#settings.cooldownMs;
    this.#waitingForNeutral = this.#settings.requireNeutral;
    this.#stableSince = now;

    this.dispatchEvent(new CustomEvent('flick', { detail: candidate }));
  }

  #emitStatus(message, tone) {
    this.dispatchEvent(new CustomEvent('status', { detail: { message, tone } }));
  }
}

function normalizeRotationRate(rotationRate) {
  if (!rotationRate) return { ...ZERO_RATES };

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

function mapRates(raw, axisMap) {
  return CUBE_AXES.reduce((rates, axis) => {
    const row = axisMap[axis];
    rates[axis] = raw[row.source] * row.sign;
    return rates;
  }, {});
}

function detectFlick(mappedRates, settings) {
  const dominant = absMax(mappedRates);
  const dominantSpeed = Math.abs(dominant.value);

  if (dominantSpeed < settings.velocityThreshold) return null;

  const runnerUp = secondLargestAbs(mappedRates, dominant.axis);
  const ratio = dominantSpeed / Math.max(runnerUp, 1);
  if (ratio < settings.dominanceRatio) return null;

  return {
    axis: dominant.axis,
    direction: Math.sign(dominant.value) || 1,
    speed: dominantSpeed,
    ratio,
    rates: mappedRates,
  };
}
