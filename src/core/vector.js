export function dot2(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function length2(vector) {
  return Math.hypot(vector.x, vector.y);
}

export function normalize2(vector) {
  const length = length2(vector);
  if (length < 0.000001) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

export function dot3(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function length3(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

export function normalize3(vector) {
  const length = length3(vector);
  if (length < 0.000001) return { x: 0, y: 0, z: 0 };
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

export function angleFromVector(vector) {
  return Math.atan2(vector.y, vector.x) * (180 / Math.PI);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
