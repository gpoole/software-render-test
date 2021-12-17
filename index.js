import track1 from "./track1";

const TRACK_WIDTH = 640;
const TRACK_HEIGHT = 480;
const TRACK_CENTRE = [
  TRACK_WIDTH / 2,
  TRACK_HEIGHT / 2,
];

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 480;
const GROUND_START = 300;
const FOV = 60;
const NEAR_PLANE_ANGLE = 180 - (180 - FOV) / 2;
const CAMERA_NEAR = 50;
const CAMERA_FAR = 300;
const DEG_2_RAD = Math.PI / 180;
const SCREEN_X_STEP = VIEW_WIDTH / FOV;
const SCREEN_FOV_STEP = FOV / VIEW_WIDTH;
const SCREEN_Y_STEP = 1;
const DEBUG_DISPLAY = document.getElementById('log');

const VECTOR_UP = [0, -1];

const logValues = {};

const log = (id, value) => {
  logValues[id] = value;
}

const rotateVector = (x, y, angle) => {
  const cosA = Math.cos(angle * DEG_2_RAD);
  const sinA = Math.sin(angle * DEG_2_RAD);
  return [
    cosA * x - sinA * y,
    sinA * x + cosA * y
  ];
}

const magnitude = (x, y) => {
  return Math.sqrt(x * x + y * y);
}

const divideScalar = (x, y, value) => {
  return [
    x / value,
    y / value
  ];
}

const multiplyScalar = (x, y, value) => {
  return [
    x * value,
    y * value,
  ];
}

const add = (x, y, x1, y1) => {
  return [
    x + x1,
    y + y1,
  ]
}

const normalise = (x, y) => {
  const mag = magnitude(x, y);
  return divideScalar(x, y, mag);
}

let canvas;
let ctx;
let imgData;
let lastUpdateTime;
let cameraPos = {  position: [0, 0], rotation: 0 };

const drawCircle = (x, y, radius, color = "red") => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 360 * DEG_2_RAD);
  ctx.stroke();
}

const getPixelFromInt32 = (value) => {
  const r = value & 0x00ff0000;
  const g = value & 0x0000ff00;
  const b = value & 0x000000ff;
  return [r, g, b, 255];
}

const getBitmapPixel = (bitmap, x, y) => {
  return getPixelFromInt32(bitmap[(y * VIEW_WIDTH) + x]);
}

const snapVector = (x, y) => [
  Math.round(x),
  Math.round(y)
]

const clamp = (value, min, max) => {
  return Math.max(min, Math.min(value, max));
}

const setPixel = (x, y, r, g, b, a) => {
  const i = (y * VIEW_WIDTH * 4) + (x * 4);
  imgData.data[i] = r;
  imgData.data[i + 1] = g;
  imgData.data[i + 2] = b;
  imgData.data[i + 3] = a;
}

const worldToGround = (x, y) => {
  return add(x, y, ...TRACK_CENTRE);
}

let sample = 0;

const renderGround = () => {
  // Start with a ray pointing along the leftmost edge of the view frustum
  let screenRay = normalise(...rotateVector(...VECTOR_UP, cameraPos.rotation - (FOV / 2)));
  // Create a ray pointing across the leftmost ray at the angle of the near plane
  // FIXME: not really near, it's near minus whatever the angle loss is but does it matter?
  let crossDirection = normalise(...rotateVector(...screenRay, NEAR_PLANE_ANGLE));
  let xStep = multiplyScalar(...crossDirection, SCREEN_X_STEP * 0.01);
  let currentNearPos = add(
    ...worldToGround(...cameraPos.position),
    ...multiplyScalar(...screenRay, CAMERA_NEAR)
  );
  drawCircle(...worldToGround(...cameraPos.position), 5);
  drawCircle(...currentNearPos, 5)
  drawCircle(...add(...currentNearPos, ...xStep), 5)

  for (let x = 0; x < VIEW_WIDTH; x++) {
    screenRay = normalise(...rotateVector(...screenRay, SCREEN_FOV_STEP));
    currentNearPos = add(...currentNearPos, ...xStep);
    // drawCircle(...currentNearPos, 5)
    let yStep = multiplyScalar(...screenRay, SCREEN_Y_STEP);
    let groundPos = [...currentNearPos];
    // drawCircle(...add(...currentNearPos, ...multiplyScalar(...screenRay, SCREEN_Y_STEP * 5)), 5, 'blue');
    for (let y = GROUND_START; y < VIEW_HEIGHT; y++) {
      groundPos = add(...groundPos, ...yStep);
      // const rawCoord = (x * VIEW_WIDTH) + y;
      // if (!sample || rawCoord === sample) {
        // sample = rawCoord + 1;
        // drawCircle(...groundPos, 5, 'blue');
      // }

      setPixel(x, y, ...getBitmapPixel(track1, ...snapVector(...groundPos)));
    }
  }
}

const render = (deltaTime) => {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.putImageData(imgData, 0, 0);

  renderGround();
}

const updateDebugInfo = () => {
  let out = "";
  Object.entries(logValues).forEach(([key, value]) => {
    out += `${key}=${(value || "").toString()}\n`;
  })
  DEBUG_DISPLAY.value = out;
}

const update = (time) => {
  const deltaTime = lastUpdateTime ? (time - lastUpdateTime) / 1000 : 0;
  lastUpdateTime = time;

  cameraPos.rotation += 5 * deltaTime;

  render(deltaTime);

  updateDebugInfo();

  requestAnimationFrame(update);
}

const init = () => {
  canvas = document.getElementById('view');
  
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;

  ctx = canvas.getContext('2d');

  imgData = ctx.createImageData(VIEW_WIDTH, VIEW_HEIGHT);

  requestAnimationFrame(update);
}

init();