import { selectContainerAxis } from './flick-detector.js';
import { length3 } from './vector.js';

const ZERO_RAW = Object.freeze({ alpha: 0, beta: 0, gamma: 0 });
const ZERO_VECTOR = Object.freeze({ x: 0, y: 0, z: 0 });

export class MotionController extends EventTarget {
  #settings;
  #getCubeAxes;
  #enabled = false;
  #touchActive = false;
  #smoothedRaw = { ...ZERO_RAW };
  #cooldownUntil = 0;
  #waitingForNeutral = false;
  #stableSince = performance.now();
  #boundMotionHandler = this.#handleMotion.bind(this);

  constructor(settings, getCubeAxes) {
    super();
    this.#settings = settings;
    this.#getCubeAxes = getCubeAxes;
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
      this.#emitStatus('Motion enabled');
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

  detectManualSnap(axis, direction) {
    return {
      axis,
      direction: Math.sign(direction) || 1,
      confidence: 1,
      speed: 0,
      containerVector: { ...ZERO_VECTOR },
      runnerUpConfidence: 0,
    };
  }

  #handleMotion(event) {
    const now = performance.now();
    const raw = normalizeRotationRate(event.rotationRate);
    this.#smoothedRaw = smoothRates(this.#smoothedRaw, raw, this.#settings.smoothing);
    const containerVector = mapRawToContainer(this.#smoothedRaw, this.#settings.sensorMap);
    const speed = length3(containerVector);

    this.dispatchEvent(
      new CustomEvent('telemetry', {
        detail: {
          raw: this.#smoothedRaw,
          container: containerVector,
          speed,
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

    const flick = selectContainerAxis(containerVector, this.#getCubeAxes(), this.#settings);
    if (!flick) return;

    this.#cooldownUntil = now + this.#settings.cooldownMs;
    this.#waitingForNeutral = this.#settings.requireNeutral;
    this.#stableSince = now;

    this.dispatchEvent(new CustomEvent('flick', { detail: flick }));
  }

  #emitStatus(message, tone = 'ready') {
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

function mapRawToContainer(raw, sensorMap = {}) {
  const containerX = sensorMap.containerX ?? { source: 'beta', sign: 1 };
  const containerY = sensorMap.containerY ?? { source: 'gamma', sign: 1 };
  const containerZ = sensorMap.containerZ ?? { source: 'alpha', sign: 1 };

  return {
    x: raw[containerX.source] * containerX.sign,
    y: raw[containerY.source] * containerY.sign,
    z: raw[containerZ.source] * containerZ.sign,
  };
}
