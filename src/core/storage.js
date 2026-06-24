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
    sensorMap: {
      ...structuredClone(defaults.sensorMap),
      ...(stored?.sensorMap ?? {}),
      screenX: {
        ...defaults.sensorMap.screenX,
        ...(stored?.sensorMap?.screenX ?? {}),
      },
      screenY: {
        ...defaults.sensorMap.screenY,
        ...(stored?.sensorMap?.screenY ?? {}),
      },
    },
  };
}
