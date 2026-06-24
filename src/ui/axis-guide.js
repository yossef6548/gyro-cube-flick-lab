export function renderAxisGuide(cubeAxes) {
  for (const axis of ['x', 'y', 'z']) {
    const line = document.querySelector(`.axis-line-${axis}`);
    if (!line) continue;

    line.style.setProperty('--angle', `${cubeAxes[axis].angle}deg`);
    line.style.setProperty('--depth', String(cubeAxes[axis].depth));

    const label = line.querySelector('b');
    if (label) {
      label.textContent = vectorToArrow(cubeAxes[axis].screen);
      label.title = `Current ${axis.toUpperCase()}-axis flick direction`;
    }
  }
}

export function vectorToArrow(vector) {
  const angle = Math.atan2(vector.y, vector.x) * (180 / Math.PI);
  const normalized = ((angle % 360) + 360) % 360;

  if (normalized < 22.5 || normalized >= 337.5) return '→';
  if (normalized < 67.5) return '↗';
  if (normalized < 112.5) return '↑';
  if (normalized < 157.5) return '↖';
  if (normalized < 202.5) return '←';
  if (normalized < 247.5) return '↙';
  if (normalized < 292.5) return '↓';
  return '↘';
}
