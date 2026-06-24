export function renderAxisGuide(cubeAxes) {
  for (const axis of ['x', 'y', 'z']) {
    const line = document.querySelector(`.axis-line-${axis}`);
    if (!line) continue;
    line.style.setProperty('--angle', `${cubeAxes[axis].angle}deg`);
    line.style.setProperty('--depth', String(cubeAxes[axis].depth));
  }
}
