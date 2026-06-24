const DEG_TO_RAD = Math.PI / 180;
const ROUND_EPSILON = 1e-10;

export function identity3() {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

export function multiply3(a, b) {
  return [0, 1, 2].map((row) =>
    [0, 1, 2].map((column) =>
      cleanNumber(a[row][0] * b[0][column] + a[row][1] * b[1][column] + a[row][2] * b[2][column]),
    ),
  );
}

export function transformVector3(matrix, vector) {
  return {
    x: cleanNumber(matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z),
    y: cleanNumber(matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z),
    z: cleanNumber(matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z),
  };
}

export function rotationMatrix(axis, degrees) {
  const radians = degrees * DEG_TO_RAD;
  const c = cleanNumber(Math.cos(radians));
  const s = cleanNumber(Math.sin(radians));

  if (axis === 'x') {
    return [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c],
    ];
  }

  if (axis === 'y') {
    return [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ];
  }

  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

export function toCssMatrix3d(matrix) {
  // CSS matrix3d is column-major. This project stores matrices row-major.
  const values = [
    matrix[0][0],
    matrix[1][0],
    matrix[2][0],
    0,
    matrix[0][1],
    matrix[1][1],
    matrix[2][1],
    0,
    matrix[0][2],
    matrix[1][2],
    matrix[2][2],
    0,
    0,
    0,
    0,
    1,
  ];

  return `matrix3d(${values.map((value) => cleanNumber(value).toFixed(10)).join(',')})`;
}

export function cleanMatrix(matrix) {
  return matrix.map((row) => row.map(cleanNumber));
}

function cleanNumber(value) {
  if (Math.abs(value) < ROUND_EPSILON) return 0;
  if (Math.abs(value - 1) < ROUND_EPSILON) return 1;
  if (Math.abs(value + 1) < ROUND_EPSILON) return -1;
  return value;
}
