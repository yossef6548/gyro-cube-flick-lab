import { dot3, length3, normalize3 } from './vector.js';

export function selectProjectedAxis(containerAngularVelocity, projectedAxes, settings) {
  const speed = length3(containerAngularVelocity);
  if (speed < settings.planarThreshold) return null;

  const normalizedVelocity = normalize3(containerAngularVelocity);
  const directionSign = settings.snapDirectionSign ?? 1;

  const candidates = Object.values(projectedAxes)
    .map((axis) => {
      const motionAxis = axis.motion ?? axis.container ?? { x: axis.screen.x, y: axis.screen.y, z: 0 };
      const score = dot3(normalizedVelocity, motionAxis);
      return {
        axis: axis.axis,
        direction: (Math.sign(score) || 1) * directionSign,
        score: Math.abs(score),
        signedScore: score,
        speed,
        vector: normalizedVelocity,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const runnerUp = candidates[1];

  if (!best || best.score < settings.projectionConfidence) return null;

  return {
    axis: best.axis,
    direction: best.direction,
    confidence: best.score,
    speed,
    containerVector: normalizedVelocity,
    runnerUpConfidence: runnerUp?.score ?? 0,
  };
}
