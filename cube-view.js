import { axisLabel } from './utils.js';

const SNAP_DEGREES = 90;
const BASE_TRANSFORM = 'rotateX(-27deg) rotateY(-8deg) rotateZ(0deg)';

export class CubeView {
  #cubeElement;
  #moves = [];

  constructor(cubeElement) {
    this.#cubeElement = cubeElement;
    this.render();
  }

  snap(axis, direction) {
    const move = {
      axis,
      direction: Math.sign(direction) || 1,
      degrees: SNAP_DEGREES,
      label: axisLabel(axis, direction),
    };

    this.#moves.push(move);
    this.render();
    this.#pulse(move.axis);
    return move;
  }

  reset() {
    this.#moves = [];
    this.render();
    this.#cubeElement.classList.remove('pulse-x', 'pulse-y', 'pulse-z');
  }

  getMoveCount() {
    return this.#moves.length;
  }

  render() {
    const transform = this.#moves.reduce((parts, move) => {
      parts.push(`rotate${move.axis.toUpperCase()}(${move.direction * move.degrees}deg)`);
      return parts;
    }, [BASE_TRANSFORM]);

    this.#cubeElement.style.transform = transform.join(' ');
  }

  #pulse(axis) {
    this.#cubeElement.classList.remove('pulse-x', 'pulse-y', 'pulse-z');
    window.requestAnimationFrame(() => {
      this.#cubeElement.classList.add(`pulse-${axis}`);
    });
  }
}
