export const DEG_2_RAD = Math.PI / 180

export const MAT_IDENTITY = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
]

export const printMatrix = (matrix, cols = 3) => {
  for (let i = 0; i < matrix.length; i += cols) {
    console.log(matrix.slice(i, i + cols))
  }
}

export const createProjective3x3Matrix = (rotation, translation, elation, scale = 1) => [
  scale * Math.cos(rotation * DEG_2_RAD), scale * -Math.sin(rotation * DEG_2_RAD), translation[0],
  scale * Math.sin(rotation * DEG_2_RAD), scale * Math.cos(rotation * DEG_2_RAD), translation[1],
  elation[0], elation[1], 1
]

export const createScaleMatrix = (scale) => [
  scale[0], 0, 0,
  0, scale[1], 0,
  0, 0, 1
]

export const createRotationMatrix = (rotation) => [
  Math.cos(rotation * DEG_2_RAD), -Math.sin(rotation * DEG_2_RAD), 0,
  Math.sin(rotation * DEG_2_RAD), Math.cos(rotation * DEG_2_RAD), 0,
  0, 0, 1
]

export const createTranslationMatrix = (position) => [
  1, 0, position[0],
  0, 1, position[1],
  0, 0, 1
]

export const createElationMatrix = (elation) => [
  1, 0, 0,
  0, 1, 0,
  elation[0], elation[1], 1
]

// FIXME: this is wrong, it should be based on the vanishing point being where
// y * elation[1] = 1 (where 1 is the bottom right cell)
export const createPerspectiveMatrix = (near, far) => [
  1, 0, 0,
  0, 1, 0,
  0, near / far, 1
]

export const vectorBy3x3Matrix = (vector, matrix) => {
  const [x, y, w = 1] = vector
  return [
    matrix[0] * x + matrix[1] * y + matrix[2] * w,
    matrix[3] * x + matrix[4] * y + matrix[5] * w,
    matrix[6] * x + matrix[7] * y + matrix[8] * w
  ]
}

export const addVector2 = (a, b) => [
  a[0] + b[0],
  a[1] + b[1]
]

export const snapVector2 = (vec) => [
  Math.round(vec[0]),
  Math.round(vec[1])
]

export const multiply3x3Matrices = (...matrices) => {
  // multiply matrices in reverse order
  let out = matrices[0]
  for (let i = 1; i < matrices.length; i++) {
    out = multiply3x3Matrix(out, matrices[i])
  }
  return out
}

export const multiply3x3Matrix = (a, b) => {
  const size = 3
  const out = []
  // rows
  for (let i = 0; i < size; i++) {
    // columns
    for (let j = 0; j < size; j++) {
      let sum = 0
      for (let k = 0; k < size; k++) {
        sum += a[i * size + k] * b[k * size + j]
      }
      out[i * size + j] = sum
    }
  }
  return out
}

export const multiplyMatrixByScalar = (matrix, s) => {
  const out = []
  for (let i = 0; i < matrix.length; i++) {
    out[i] = matrix[i] * s
  }
  return out
}

// Based on https://www.mathsisfun.com/algebra/matrix-inverse-minors-cofactors-adjugate.html
// with some operations pre-applied to calculate the adjoint
export const invert3x3Matrix = (matrix) => {
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = matrix
  const d00 = m11 * m22 - m12 * m21
  const d01 = m10 * m22 - m20 * m12
  const d02 = m10 * m21 - m20 * m11
  const adjoint = [
    d00, -(m01 * m22 - m21 * m02), m01 * m12 - m11 * m02,
    -d01, m00 * m22 - m20 * m02, -(m00 * m12 - m10 * m02),
    d02, -(m00 * m21 - m20 * m01), m00 * m11 - m10 * m01
  ]
  const inverseDeterminant = 1 / (m00 * d00 + m01 * d01 + m02 * d02)
  return multiplyMatrixByScalar(adjoint, inverseDeterminant)
}

// Projects input 2d vector to coordinates in the space specified by the output dimensions via the projection matrix
export const projectVector2 = (vector, projectionMatrix) => {
  const [x, y, w] = vectorBy3x3Matrix(vector, projectionMatrix)
  // w is inverted because -y is "forward", so x gets flipped otherwise
  return [
    x / -w,
    y / -w
  ]
}

export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(value, max))
}
