export const STORAGE_KEY = 'gyro-cube-flick-lab:v4-container-axis-direction-settings';
export const EVENT_LOG_LIMIT = 24;

export const DEFAULT_SETTINGS = Object.freeze({
  spinThreshold: 260,
  axisConfidence: 0.72,
  cooldownMs: 320,
  neutralThreshold: 42,
  neutralDurationMs: 140,
  smoothing: 0.2,
  requireNeutral: true,
  ignoreWhileTouching: true,
  vibrationEnabled: true,
  sensorMap: {
    containerX: { source: 'beta', sign: 1 },
    containerY: { source: 'gamma', sign: 1 },
    containerZ: { source: 'alpha', sign: 1 },
  },
  axisDirectionSigns: {
    x: 1,
    // The visible top-face axis is the cube's local Y axis. This fixes the
    // tested “right moves left / left moves right” inversion without changing
    // sensor mapping or axis selection.
    y: -1,
    z: 1,
  },
});

export const SETTING_UNITS = Object.freeze({
  spinThreshold: '°/s',
  axisConfidence: '',
  cooldownMs: 'ms',
  neutralThreshold: '°/s',
  neutralDurationMs: 'ms',
  smoothing: '',
});
