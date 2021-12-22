const DEG_2_RAD = Math.PI / 180;
const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 480;

const createProjective3x3Matrix = (rotation, translation, projection, scale = 1) => [
  scale * Math.cos(rotation * DEG_2_RAD), scale * -Math.sin(rotation * DEG_2_RAD), translation[0],
  scale * Math.sin(rotation * DEG_2_RAD), scale * Math.cos(rotation * DEG_2_RAD), translation[1],
  projection[0], projection[1], 1
]

const vector2By3x3Matrix = (vector, matrix) => {
  return [
    matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2],
    matrix[3] * vector[0] + matrix[4] * vector[1] + matrix[5],
    matrix[6] * vector[0] + matrix[7] * vector[1] + matrix[8] 
  ]
}

const projectVector2 = (vector, matrix) => {
  const result = vector2By3x3Matrix(vector, matrix);
  return [
    result[0] / result[2],
    result[1] / result[2],
  ]
}

let canvas;
let ctx;
let transform;
let lastUpdateTime;
let elation = [0, 0];
let translation = [320, 240];
let rotation = 0;

const drawCircle = (x, y, radius, color = "red") => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 360 * DEG_2_RAD);
  ctx.stroke();
}

const drawLine = (from, to, color) => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.stroke();
}

const html = (parts, ...values) => {
  let content;
  for (let i = 0; i < parts.length; i++) {
    if (i < values.length) {
      content += `${parts[i]}${values[i].toString()}`;
    } else {
      content += parts[i];
    }
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = content;
  if (wrapper.children.length === 1) {
    return wrapper.children.item(0);
  }
  return wrapper.children;
}

const createSlider = (name, initialValue, [min, max], step, onChange) => {
  const content = html`
    <div>
      <label>${name}</label>
      <input type="range" value="${initialValue}" min="${min}" max="${max}" step="${step}" />
      <input type="number" value="${initialValue}" min="${min}" max="${max}" step="${step}" />
      <button>Reset</button>
    </div>
  `;

  const setValue = (value) => {
    onChange(value);
    slider.value = value;
    spinner.value = value;
  }

  const changeHandler = (event) => {
    setValue(parseFloat(event.target.value, 10));
  }

  const slider = content.querySelector('input[type="range"]');
  slider.addEventListener('input', changeHandler);

  const spinner = content.querySelector('input[type="number"]');
  spinner.addEventListener('input', changeHandler);

  const reset = content.querySelector('button');
  reset.addEventListener('click', () => {
    setValue(initialValue);
  });

  return content;
}

const addVector2 = (a, b) => [
  a[0] + b[0],
  a[1] + b[1],
];

const render = () => {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // const start = [0, -50];
  // const end = [0, 50];
  // const transformed = vector2By3x3Matrix(target, transform);
  // drawCircle(transformed[0], transformed[1], 5);
  // drawLine(vector2By3x3Matrix(start, transform), vector2By3x3Matrix(end, transform), "red");
  // drawLine(projectVector2(start, transform), projectVector2(end, transform), "red");
  ctx.strokeStyle = "red";
  ctx.beginPath();
  const topLeft = projectVector2([-50, -50], transform);
  ctx.moveTo(...topLeft);
  ctx.lineTo(...projectVector2([50, -50], transform));
  ctx.lineTo(...projectVector2([50, 50], transform));
  ctx.lineTo(...projectVector2([-50, 50], transform));
  ctx.lineTo(...topLeft);
  ctx.stroke();
}

const update = (time) => {
  const deltaTime = lastUpdateTime ? (time - lastUpdateTime) / 1000 : 0;
  lastUpdateTime = time;

  transform = createProjective3x3Matrix(rotation, translation, elation);

  render(deltaTime);

  requestAnimationFrame(update);
}

const createControls = () => {
  const controls = document.getElementById('controls');

  const addControl = (control) => controls.appendChild(control);

  addControl(createSlider("elationX", elation[0], [-0.01, 0.01], 0.0001, (value) => elation[0] = value));
  addControl(createSlider("elationY", elation[1], [-0.01, 0.01], 0.0001, (value) => elation[1] = value));
  addControl(createSlider("translateX", translation[0], [0, VIEW_WIDTH], 1, (value) => translation[0] = value));
  addControl(createSlider("translateY", translation[1], [0, VIEW_HEIGHT], 1, (value) => translation[1] = value));
  addControl(createSlider("rotation", rotation, [-360, 360], 1, value => rotation = value));
}

const init = () => {
  canvas = document.getElementById('view');
  
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;

  ctx = canvas.getContext('2d');

  createControls();

  requestAnimationFrame(update);
}

init();
