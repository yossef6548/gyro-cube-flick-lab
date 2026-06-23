import { MAX_METER_DEGREES_PER_SECOND } from './config.js';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value, digits = 0) {
  return Number(value).toFixed(digits);
}

export function absMax(values) {
  return Object.entries(values).reduce(
    (best, [axis, value]) => (Math.abs(value) > Math.abs(best.value) ? { axis, value } : best),
    { axis: 'x', value: 0 },
  );
}

export function secondLargestAbs(values, dominantAxis) {
  return Object.entries(values).reduce((max, [axis, value]) => {
    if (axis === dominantAxis) return max;
    return Math.max(max, Math.abs(value));
  }, 0);
}

export function meterScale(value) {
  return clamp(Math.abs(value) / MAX_METER_DEGREES_PER_SECOND, 0, 1);
}

export function axisLabel(axis, direction) {
  const normalized = axis.toUpperCase();
  return `${normalized}${direction > 0 ? '+' : '−'}`;
}

export function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
