import { angleFromVector, normalize2 } from './vector.js';
import { cleanMatrix, identity3, multiply3, rotationMatrix, toCssMatrix3d, transformVector3 } from './matrix3.js';

const SNAP_DEGREES = 90;
const LOCAL_AXES = Object.freeze({
  x: Object.freeze({ x: 1, y: 0, z: 0 }),
  y: Object.freeze({ x: 0, y: 1, z: 0 }),
  z: Object.freeze({ x: 0, y: 0, z: 1 }),
});

// Isometric-style camera: three cube faces stay equally visible after every snap.
const VIEW_MATRIX = multiply3(rotationMatrix('x', -35.2643897), rotationMatrix('y', 45));

export class CubeOrientation extends EventTarget {
  #cubeElement;
  #orientation = identity3();
  #moveCount = 0;

  constructor(cubeElement) {
    super();
    this.#cubeElement = cubeElement;
    this.render();
  }

  snap(axis, direction) {
    const normalizedDirection = Math.sign(direction) || 1;
    const localRotation = rotationMatrix(axis, SNAP_DEGREES * normalizedDirection);

    // Post-multiply: the snap happens around the cube's current local axis, not the original world axis.
    this.#orientation = cleanMatrix(multiply3(this.#orientation, localRotation));
    this.#moveCount += 1;
    this.render();

    const move = {
      axis,
      direction: normalizedDirection,
      label: `${axis.toUpperCase()}${normalizedDirection > 0 ? '+' : '−'}`,
      moveCount: this.#moveCount,
      projectedAxes: this.getProjectedAxes(),
    };

    this.dispatchEvent(new CustomEvent('change', { detail: move }));
    return move;
  }

  reset() {
    this.#orientation = identity3();
    this.#moveCount = 0;
    this.render();
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          axis: null,
          direction: 0,
          label: 'Reset',
          moveCount: this.#moveCount,
          projectedAxes: this.getProjectedAxes(),
        },
      }),
    );
  }

  render() {
    const viewOrientation = multiply3(VIEW_MATRIX, this.#orientation);
    this.#cubeElement.style.transform = toCssMatrix3d(viewOrientation);
  }

  getProjectedAxes() {
    const matrix = multiply3(VIEW_MATRIX, this.#orientation);

    return Object.entries(LOCAL_AXES).reduce((axes, [axis, vector]) => {
      const transformed = transformVector3(matrix, vector);
      const screen = normalize2({ x: transformed.x, y: -transformed.y });

      axes[axis] = {
        axis,
        screen,
        angle: angleFromVector(screen),
        depth: transformed.z,
      };
      return axes;
    }, {});
  }
}
