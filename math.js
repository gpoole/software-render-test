export const DEG_2_RAD = Math.PI / 180

export const createProjective3x3Matrix = (rotation, translation, elation, scale = 1) => [
  scale * Math.cos(rotation * DEG_2_RAD), scale * -Math.sin(rotation * DEG_2_RAD), translation[0],
  scale * Math.sin(rotation * DEG_2_RAD), scale * Math.cos(rotation * DEG_2_RAD), translation[1],
  elation[0], elation[1], 1
]

export const createScaleMatrix = (scale) => [
  scale, 0, 0,
  0, scale, 0,
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

// Projects input 2d vector to coordinates in the space specified by the output dimensions via the projection matrix
export const projectVector2 = (vector, projectionMatrix, outputDimensions) => {
  const [x, y, w] = vectorBy3x3Matrix(vector, projectionMatrix)
  const [nx, ny] = [
    x / w,
    y / w
  ]

  return [nx, ny]
  // return [
  //   nx + (outputDimensions[0] / 2),
  //   ny + (outputDimensions[1] / 2)
  // ]
}

export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(value, max))
}
