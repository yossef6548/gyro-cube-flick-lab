import { dot2, length2, normalize2 } from './vector.js';

export function selectProjectedAxis(screenVector, projectedAxes, settings) {
  const speed = length2(screenVector);
  if (speed < settings.planarThreshold) return null;

  const normalizedVector = normalize2(screenVector);
  const ranked = Object.values(projectedAxes)
    .map((axis) => {
      const dot = dot2(normalizedVector, axis.screen);
      return {
        axis: axis.axis,
        direction: Math.sign(dot) || 1,
        score: Math.abs(dot),
        dot,
        speed,
        vector: normalizedVector,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < settings.projectionConfidence) return null;

  return {
    axis: best.axis,
    direction: best.direction,
    confidence: best.score,
    speed,
    screenVector: normalizedVector,
    runnerUpConfidence: ranked[1]?.score ?? 0,
  };
}
