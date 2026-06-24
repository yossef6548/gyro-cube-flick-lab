import { dot3, length3, normalize3 } from './vector.js';

export function selectContainerAxis(containerAngularVelocity, cubeAxes, settings) {
  const speed = length3(containerAngularVelocity);
  if (speed < settings.spinThreshold) return null;

  const normalizedVelocity = normalize3(containerAngularVelocity);
  const axisDirectionSigns = settings.axisDirectionSigns ?? {};

  const candidates = Object.values(cubeAxes)
    .map((axis) => {
      const motionAxis = normalize3(axis.motion);
      const signedScore = dot3(normalizedVelocity, motionAxis);
      const axisDirectionSign = axisDirectionSigns[axis.axis] ?? 1;

      return {
        axis: axis.axis,
        // Axis selection and direction correction are intentionally separate.
        // Inverting a sensor input axis changes the 3D vector before selection
        // and can accidentally match another axis. Inverting a cube axis here
        // only reverses the final snap direction after the best axis is known.
        direction: (Math.sign(signedScore) || 1) * axisDirectionSign,
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
