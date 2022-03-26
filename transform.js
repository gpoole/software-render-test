// const logMatrix = (matrix, size) => {
//   for (let i = 0; i < size; i++) {
//     console.log(matrix.slice(i * size, i * size + size))
//   }
// }

import { createElationMatrix, createPerspectiveMatrix, createProjective3x3Matrix, createRotationMatrix, createScaleMatrix, createTranslationMatrix, DEG_2_RAD, multiply3x3Matrix, projectVector2, snapVector2 } from './math'
import { getPixel, loadImageData, setPixel } from './texture'

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 480
const SCREEN_DIMENSIONS = [VIEW_WIDTH, VIEW_HEIGHT]
const VIEW_GROUND_STARTS_AT = 300

let canvas
let ctx
// let transform;
let lastUpdateTime
const elation = [0, 0]
const translation = [0, 0]
let rotation = 0
const height = 300
const width = VIEW_WIDTH
let scale = 0.25
// const fov = 45
const near = 1
const far = 200
let viewGroundLayer
let groundTexture
let groundTextureDimensions

const drawCircle = (x, y, radius, color = 'red') => {
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 360 * DEG_2_RAD)
  ctx.stroke()
}

// const drawLine = (from, to, color) => {
//   ctx.strokeStyle = color
//   ctx.beginPath()
//   ctx.moveTo(...from)
//   ctx.lineTo(...to)
//   ctx.stroke()
// }

const html = (parts, ...values) => {
  let content
  for (let i = 0; i < parts.length; i++) {
    if (i < values.length) {
      content += `${parts[i]}${values[i].toString()}`
    } else {
      content += parts[i]
    }
  }
  const wrapper = document.createElement('div')
  wrapper.innerHTML = content
  if (wrapper.children.length === 1) {
    return wrapper.children.item(0)
  }
  return wrapper.children
}

const createSlider = (name, initialValue, [min, max], step, onChange) => {
  const content = html`
    <div>
      <label>${name}</label>
      <input type="range" value="${initialValue}" min="${min}" max="${max}" step="${step}" />
      <input type="number" value="${initialValue}" min="${min}" max="${max}" step="${step}" />
      <button>Reset</button>
    </div>
  `

  const setValue = (value) => {
    onChange(value)
    slider.value = value
    spinner.value = value
  }

  const changeHandler = (event) => {
    setValue(parseFloat(event.target.value, 10))
  }

  const slider = content.querySelector('input[type="range"]')
  slider.addEventListener('input', changeHandler)

  const spinner = content.querySelector('input[type="number"]')
  spinner.addEventListener('input', changeHandler)

  const reset = content.querySelector('button')
  reset.addEventListener('click', () => {
    setValue(initialValue)
  })

  return content
}

const renderGround = (viewToGround) => {
  if (!groundTexture) {
    return
  }
  // for (let y = VIEW_GROUND_STARTS_AT; y < VIEW_HEIGHT; y++) {
  for (let y = 0; y < VIEW_HEIGHT; y++) {
    for (let x = 0; x < VIEW_WIDTH; x++) {
      const groundPosition = projectVector2([x, -y], viewToGround, groundTextureDimensions)
      const groundTexturePosition = snapVector2(groundPosition)
      const sampledPixel = getPixel(groundTexture, ...groundTexturePosition)
      setPixel(viewGroundLayer, x, VIEW_HEIGHT - y, ...sampledPixel)
    }
  }
}

const multiply3x3Matrices = (...matrices) => {
  // multiply matrices in reverse order
  return matrices.slice(1).reduce((acc, matrix) => multiply3x3Matrix(acc, matrix), matrices[0])
}

const render = () => {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)

  // const perspective = createPerspectiveMatrix(near, far)
  // const translate = createTranslationMatrix(translation)
  // const rotate = createRotationMatrix(rotation)
  // const scaleMatrix = createScaleMatrix(scale)
  // const perspective = createProjective3x3Matrix(rotation, translation, elation);
  // const transform = [
  //   // Affect x using the x and y components, add transform
  //   1, 0, 0,
  //   // Affect y using the x and y components, add transform
  //   0, 1, 0,
  //   // Affect w using the x and y components, add 1
  //   0, 1, 0
  // ];
  // const viewToGround = multiply3x3Matrix(perspective, multiply3x3Matrix(translate, rotate))
  const translationMat = createTranslationMatrix(translation)
  const elationMat = createElationMatrix(elation)
  const rotationMat = createRotationMatrix(rotation)
  // const screenToGround = multiply3x3Matrix(translationMat, multiply3x3Matrix(elationMat, rotationMat))
  // const screenToGround = createProjective3x3Matrix(rotation, translation, elation, scale)
  // const screenToGround = createProjective3x3Matrix(rotation, translation, [0, near / far], scale)

  const viewToCamera = multiply3x3Matrices(
    translationMat,
    createTranslationMatrix([VIEW_WIDTH / 2, VIEW_HEIGHT / 2]),
    rotationMat,
    createScaleMatrix(scale),
    elationMat
  )

  renderGround(viewToCamera)

  // Render the ground texture
  ctx.putImageData(viewGroundLayer, 0, 0)

  // Camera plane debugging
  ctx.strokeStyle = 'red'
  ctx.beginPath()
  // const scaledViewToCamera = viewToCamera
  // const viewToCamera = multiply3x3Matrix(viewToCamera)

  const halfWidth = VIEW_WIDTH / 2
  const halfHeight = VIEW_WIDTH / 2
  const top = -halfHeight
  const left = -halfWidth
  const right = halfWidth
  const bottom = halfHeight
  const topLeft = projectVector2([left, top], viewToCamera, SCREEN_DIMENSIONS)
  const topRight = projectVector2([right, top], viewToCamera, SCREEN_DIMENSIONS)
  const bottomRight = projectVector2([right, bottom], viewToCamera, SCREEN_DIMENSIONS)
  const bottomLeft = projectVector2([left, right], viewToCamera, SCREEN_DIMENSIONS)
  ctx.moveTo(...topLeft)
  ctx.lineTo(...topRight)
  ctx.lineTo(...bottomRight)
  ctx.lineTo(...bottomLeft)
  ctx.lineTo(...topLeft)
  ctx.stroke()

  drawCircle(...projectVector2([0, 0], viewToCamera, SCREEN_DIMENSIONS), 5, 'red')
  // 100 units in front of the camera
  drawCircle(...projectVector2([0, -100], viewToCamera, SCREEN_DIMENSIONS), 5, 'orange')
  drawCircle(...projectVector2([0, -200], viewToCamera, SCREEN_DIMENSIONS), 5, 'orange')
  // 100 units behind the camera
  drawCircle(...projectVector2([0, 100], viewToCamera, SCREEN_DIMENSIONS), 5, 'blue')
}

const update = (time) => {
  const deltaTime = lastUpdateTime ? (time - lastUpdateTime) / 1000 : 0
  lastUpdateTime = time

  render(deltaTime)

  window.requestAnimationFrame(update)
}

const createControls = () => {
  const controls = document.getElementById('controls')

  const addControl = (control) => controls.appendChild(control)

  // addControl(createSlider('elationX', elation[0], [-0.01, 0.01], 0.0001, (value) => elation[0] = value))
  addControl(createSlider('elationY', elation[1], [-0.01, 0.01], 0.0001, (value) => elation[1] = value))
  addControl(createSlider('translateX', translation[0], [-VIEW_WIDTH, VIEW_WIDTH], 1, (value) => translation[0] = value))
  addControl(createSlider('translateY', translation[1], [-VIEW_HEIGHT, VIEW_HEIGHT], 1, (value) => translation[1] = value))
  addControl(createSlider('rotation', rotation, [-360, 360], 1, value => rotation = value))
  // addControl(createSlider('near', near, [0, VIEW_HEIGHT * 2], 1, value => near = value))
  // addControl(createSlider('far', far, [0, VIEW_HEIGHT * 2], 1, value => far = value))
  addControl(createSlider('scale', scale, [0, 5], 0.1, value => scale = value))
  // addControl(createSlider("height", height, [0, 1000], 1, value => height = value));
  // addControl(createSlider("width", width, [0, 1000], 1, value => width = value));
  // addControl(createSlider("fov", fov, [0, 90], 1, value => fov = value));
}

const loadAssets = async () => {
  groundTexture = await loadImageData('/assets/whacky-tracky.png')
  groundTextureDimensions = [groundTexture.width, groundTexture.height]
}

const init = () => {
  canvas = document.getElementById('view')

  canvas.width = VIEW_WIDTH
  canvas.height = VIEW_HEIGHT

  ctx = canvas.getContext('2d')

  viewGroundLayer = ctx.createImageData(VIEW_WIDTH, VIEW_HEIGHT)

  createControls()
  loadAssets()

  window.requestAnimationFrame(update)
}

init()
