import { DEFAULT_SETTINGS, STORAGE_KEY } from '../config.js';

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    return mergeSettings(DEFAULT_SETTINGS, JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetStoredSettings() {
  window.localStorage.removeItem(STORAGE_KEY);
  return structuredClone(DEFAULT_SETTINGS);
}

function mergeSettings(defaults, stored) {
  return {
    ...structuredClone(defaults),
    ...stored,
    sensorMap: mergeSensorMap(defaults.sensorMap, stored?.sensorMap),
  };
}

function mergeSensorMap(defaultMap, storedMap = {}) {
  return Object.fromEntries(
    Object.entries(defaultMap).map(([axisName, defaultAxis]) => [
      axisName,
      {
        ...defaultAxis,
        ...(storedMap?.[axisName] ?? {}),
      },
    ]),
  );
}
