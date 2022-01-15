// const logMatrix = (matrix, size) => {
//   for (let i = 0; i < size; i++) {
//     console.log(matrix.slice(i * size, i * size + size))
//   }
// }

import { createPerspectiveMatrix, createRotationMatrix, createTranslationMatrix, DEG_2_RAD, multiply3x3Matrix, projectVector2 } from './math'

const VIEW_WIDTH = 640

const VIEW_HEIGHT = 480

let canvas
let ctx
// let transform;
let lastUpdateTime
// const elation = [0, 0]
const translation = [0, 0]
let rotation = 0
const height = 300
const width = VIEW_WIDTH
let scale = 1
// const fov = 45
let near = 1
let far = 200

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

const render = () => {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)

  const perspective = createPerspectiveMatrix(near, far)
  const translate = createTranslationMatrix(translation)
  const rotate = createRotationMatrix(rotation)
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
  const view = multiply3x3Matrix(translate, rotate)
  const viewPerspective = multiply3x3Matrix(perspective, view)

  // Camera planes
  ctx.strokeStyle = 'red'
  ctx.beginPath()
  const topLeft = projectVector2([-width, -height], viewPerspective)
  const topRight = projectVector2([width, -height], viewPerspective)
  const bottomRight = projectVector2([width, 0], viewPerspective)
  const bottomLeft = projectVector2([-width, 0], viewPerspective)
  ctx.moveTo(...topLeft)
  ctx.lineTo(...topRight)
  ctx.lineTo(...bottomRight)
  ctx.lineTo(...bottomLeft)
  ctx.lineTo(...topLeft)
  ctx.stroke()

  const fixedObject = [10, -100]
  drawCircle(...projectVector2(fixedObject, viewPerspective), 5, 'red')
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

  // addControl(createSlider("elationX", elation[0], [-1, 1], 0.0001, (value) => elation[0] = value));
  // addControl(createSlider("elationY", elation[1], [-1, 1], 0.0001, (value) => elation[1] = value));
  addControl(createSlider('translateX', translation[0], [-VIEW_WIDTH, VIEW_WIDTH], 1, (value) => translation[0] = value))
  addControl(createSlider('translateY', translation[1], [-VIEW_HEIGHT, VIEW_HEIGHT], 1, (value) => translation[1] = value))
  addControl(createSlider('rotation', rotation, [-360, 360], 1, value => rotation = value))
  addControl(createSlider('near', near, [0, VIEW_HEIGHT * 2], 1, value => near = value))
  addControl(createSlider('far', far, [0, VIEW_HEIGHT * 2], 1, value => far = value))
  addControl(createSlider('scale', scale, [0, 5], 0.1, value => scale = value))
  // addControl(createSlider("height", height, [0, 1000], 1, value => height = value));
  // addControl(createSlider("width", width, [0, 1000], 1, value => width = value));
  // addControl(createSlider("fov", fov, [0, 90], 1, value => fov = value));
}

const init = () => {
  canvas = document.getElementById('view')

  canvas.width = VIEW_WIDTH
  canvas.height = VIEW_HEIGHT

  ctx = canvas.getContext('2d')

  createControls()

  window.requestAnimationFrame(update)
}

init()
