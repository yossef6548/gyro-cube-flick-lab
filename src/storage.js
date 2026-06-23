import { DEFAULT_SETTINGS, STORAGE_KEY } from './config.js';

const AXES = ['x', 'y', 'z'];
const SOURCES = ['alpha', 'beta', 'gamma'];

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return normalizeSettings(saved);
  } catch {
    return structuredDefaults();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
}

export function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
}

export function structuredDefaults() {
  return normalizeSettings(DEFAULT_SETTINGS);
}

export function normalizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {};
  const defaultSettings = DEFAULT_SETTINGS;

  const normalized = {
    velocityThreshold: numberInRange(source.velocityThreshold, defaultSettings.velocityThreshold, 120, 900),
    dominanceRatio: numberInRange(source.dominanceRatio, defaultSettings.dominanceRatio, 1.1, 4),
    cooldownMs: numberInRange(source.cooldownMs, defaultSettings.cooldownMs, 100, 1200),
    neutralThreshold: numberInRange(source.neutralThreshold, defaultSettings.neutralThreshold, 15, 180),
    neutralDurationMs: numberInRange(source.neutralDurationMs, defaultSettings.neutralDurationMs, 0, 700),
    smoothing: numberInRange(source.smoothing, defaultSettings.smoothing, 0, 0.85),
    requireNeutral: Boolean(source.requireNeutral ?? defaultSettings.requireNeutral),
    ignoreWhileTouching: Boolean(source.ignoreWhileTouching ?? defaultSettings.ignoreWhileTouching),
    vibrationEnabled: Boolean(source.vibrationEnabled ?? defaultSettings.vibrationEnabled),
    axisMap: {},
  };

  for (const axis of AXES) {
    const row = source.axisMap?.[axis] ?? defaultSettings.axisMap[axis];
    const sourceName = SOURCES.includes(row?.source) ? row.source : defaultSettings.axisMap[axis].source;
    const sign = Number(row?.sign) === -1 ? -1 : 1;
    normalized.axisMap[axis] = { source: sourceName, sign };
  }

  return normalized;
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}
