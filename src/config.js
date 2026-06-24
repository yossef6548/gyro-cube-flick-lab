export const STORAGE_KEY = 'gyro-cube-flick-lab:v2-settings';
export const EVENT_LOG_LIMIT = 24;

export const DEFAULT_SETTINGS = Object.freeze({
  planarThreshold: 260,
  projectionConfidence: 0.72,
  cooldownMs: 320,
  neutralThreshold: 42,
  neutralDurationMs: 140,
  smoothing: 0.2,
  requireNeutral: true,
  ignoreWhileTouching: true,
  vibrationEnabled: true,
  sensorMap: {
    screenX: { source: 'gamma', sign: 1 },
    screenY: { source: 'beta', sign: -1 },
  },
});

export const SETTING_UNITS = Object.freeze({
  planarThreshold: '°/s',
  projectionConfidence: '',
  cooldownMs: 'ms',
  neutralThreshold: '°/s',
  neutralDurationMs: 'ms',
  smoothing: '',
});
