export const DEFAULT_SETTINGS = Object.freeze({
  velocityThreshold: 330,
  dominanceRatio: 1.9,
  cooldownMs: 325,
  neutralThreshold: 65,
  neutralDurationMs: 175,
  smoothing: 0.22,
  requireNeutral: true,
  ignoreWhileTouching: true,
  vibrationEnabled: true,
  axisMap: Object.freeze({
    x: Object.freeze({ source: 'beta', sign: 1 }),
    y: Object.freeze({ source: 'gamma', sign: 1 }),
    z: Object.freeze({ source: 'alpha', sign: 1 }),
  }),
});

export const STORAGE_KEY = 'gyro-cube-flick-lab.settings.v1';
export const EVENT_LOG_LIMIT = 9;
export const MAX_METER_DEGREES_PER_SECOND = 900;
