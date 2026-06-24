export function renderAxisGuide(projectedAxes) {
  for (const axis of ['x', 'y', 'z']) {
    const line = document.querySelector(`.axis-line-${axis}`);
    if (!line) continue;
    line.style.setProperty('--angle', `${projectedAxes[axis].angle}deg`);
  }
}
