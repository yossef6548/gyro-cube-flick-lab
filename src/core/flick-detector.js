import { dot3, length3, normalize3 } from './vector.js';

export function selectContainerAxis(containerAngularVelocity, cubeAxes, settings) {
  const speed = length3(containerAngularVelocity);
  if (speed < settings.spinThreshold) return null;

  const normalizedVelocity = normalize3(containerAngularVelocity);
  const directionSign = settings.snapDirectionSign ?? 1;

  const candidates = Object.values(cubeAxes)
    .map((axis) => {
      const motionAxis = normalize3(axis.motion);
      const signedScore = dot3(normalizedVelocity, motionAxis);

      return {
        axis: axis.axis,
        direction: (Math.sign(signedScore) || 1) * directionSign,
        score: Math.abs(signedScore),
        signedScore,
        speed,
        vector: normalizedVelocity,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const runnerUp = candidates[1];

  if (!best || best.score < settings.axisConfidence) return null;

  return {
    axis: best.axis,
    direction: best.direction,
    confidence: best.score,
    speed,
    containerVector: normalizedVelocity,
    runnerUpConfidence: runnerUp?.score ?? 0,
  };
}
