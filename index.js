const TRACK_WIDTH = 800;
const TRACK_HEIGHT = 507;
const TRACK_CENTRE = [
  TRACK_WIDTH / 2,
  TRACK_HEIGHT / 2,
];

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 480;
const GROUND_START = 300;
const FOV = 45;
const VIEW_ANGLE = 65;
const CAMERA_NEAR = 20;
const CAMERA_FAR = 350;
const CAMERA_PITCH = 90;
const DEG_2_RAD = Math.PI / 180;
const SCREEN_GROUND_HEIGHT = (VIEW_HEIGHT - GROUND_START);
const CAMERA_HEIGHT = 10;
const NEAR_PLANE_HEIGHT = 2 * CAMERA_NEAR * Math.tan(VIEW_ANGLE / 2 * DEG_2_RAD);
const VIEW_Y_SCALE = NEAR_PLANE_HEIGHT / VIEW_HEIGHT;
const VIEW_ANGLE_STEP = (VIEW_ANGLE / 2) / SCREEN_GROUND_HEIGHT;
const DEBUG_DISPLAY = document.getElementById('log');
const PIXEL_WHITE = [255, 255, 255, 255];

const VECTOR_UP = [0, -1];

let canvas;
let ctx;
let imgData;
let lastUpdateTime;
let trackData;
let cameraPos = {  position: [0, 0], rotation: 0 };
const logValues = {};

const log = (id, value) => {
  logValues[id] = value;
}

const loadImageData = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const loaderCanvas = document.createElement('canvas');
      const loaderCtx = loaderCanvas.getContext('2d');
      loaderCanvas.width = width;
      loaderCanvas.height = height;
      loaderCtx.drawImage(img, 0, 0, width, height);
      resolve(loaderCtx.getImageData(0, 0, width, height));
    }
    img.onerror = reject;
    img.src = url;
  })
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

const getCameraForward = () => rotateVector(...VECTOR_UP, cameraPos.rotation);

const drawCircle = (x, y, radius, color = "red") => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 360 * DEG_2_RAD);
  ctx.stroke();
}

const snapVector = (x, y) => [
  Math.round(x),
  Math.round(y)
]

const perpendicular = (x, y) => [y, -x];

const clamp = (value, min, max) => {
  return Math.max(min, Math.min(value, max));
}

const getPixelIndex = (x, y) => {
  if (x < 0 || y < 0 || x > TRACK_WIDTH || y > TRACK_HEIGHT) {
    return -1;
  }
  return (y * VIEW_WIDTH * 4) + (x * 4);
}

const setPixel = (x, y, r, g, b, a) => {
  const i = getPixelIndex(x, y);
  imgData.data[i] = r;
  imgData.data[i + 1] = g;
  imgData.data[i + 2] = b;
  imgData.data[i + 3] = a;
}

const getPixel = (imageData, x, y) => {
  const i = getPixelIndex(x, y);
  if (i === -1) {
    return PIXEL_WHITE;
  }
  return imageData.data.slice(i, i + 4);
}

const toRgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`

const worldToGround = (x, y) => {
  return add(x, y, ...TRACK_CENTRE);
}

const renderGround = () => {
  const cameraForward = getCameraForward();
  const cameraLeft = perpendicular(...cameraForward);
  const cameraRight = [
    -cameraLeft[0],
    -cameraLeft[1],
  ];

  const cameraOnGround = worldToGround(...cameraPos.position);

  // debugging: show camera position
  // drawCircle(...snapVector(...cameraOnGround), 5, 'blue');

  // start at the top of the screen (far) and work our way down to near,
  // rendering each row of pixels
  for (let y = 0; y < SCREEN_GROUND_HEIGHT; y++) {
    const worldY = CAMERA_HEIGHT - (y * VIEW_Y_SCALE);

    // Calculate the forward viewing angle relative to the ground.
    // 90 degrees is exactly forward, 180 degrees is pointing down at the ground.
    // We start at CAMERA_PITCH degrees at the top of the screen and stop at CAMERA_PITCH + (VIEW_ANGLE / 2),
    // at the bottom of the screen.
    const viewAngle = CAMERA_PITCH + (y * VIEW_ANGLE_STEP);

    // Using the inverse of the pitch angle and height off the ground to calculate distance from
    // where this row's projection ray intersects the near plane.
    const distanceFromNear = worldY * Math.tan((180 - viewAngle) * DEG_2_RAD);
    const distance = CAMERA_NEAR + distanceFromNear;

    if (distance > CAMERA_FAR || distance < CAMERA_NEAR) {
      continue;
    }

    // Calculate the width of this row of pixels in world space based on our FOV and distance
    // from the camera.
    const viewWorldWidth = distance * Math.tan(FOV / 2 * DEG_2_RAD)
    const halfWidth = (viewWorldWidth / 2);
    const xScale = viewWorldWidth / VIEW_WIDTH;

    // Project forward from the camera using this row's distance
    const centrePoint = add(
      ...cameraOnGround,
      ...multiplyScalar(...cameraForward, distance)
    );

    // Move to the leftmost point of our projection in world coordinates
    const leftPoint = add(
      ...centrePoint,
      ...multiplyScalar(...cameraLeft, halfWidth),
    );

    // Work our way from left to right across the row using our projected left point
    // and scaled size of this row in the world
    for (let x = 0; x < VIEW_WIDTH; x++) {
      const projectedPosition = add(
        ...leftPoint,
        ...multiplyScalar(...cameraRight, xScale * x),
      );

      // debugging: show the projection of screen pixels
      // drawCircle(...snapVector(...groundPos), 5, distance > 0 ? 'blue' : 'red');

      setPixel(x, GROUND_START + y, ...getPixel(trackData, ...snapVector(...projectedPosition)));
    }
  }
}

const render = () => {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.putImageData(imgData, 0, 0);

  if (trackData) {
    renderGround();
    // ctx.putImageData(trackData, 0, 0);
  }
}

const KEY_FORWARD = 'w';
const KEY_BACKWARD = 's';
const KEY_LEFT = 'a';
const KEY_RIGHT = 'd';

const inputKeys = {};
const MOVE_SPEED = 30;
const TURN_SPEED = 20;

const input = (deltaTime) => {
  if (inputKeys[KEY_FORWARD] || inputKeys[KEY_BACKWARD]) {
    const forward = getCameraForward();
    const direction = inputKeys[KEY_FORWARD] ? 1 : -1;
    cameraPos.position = add(
      ...cameraPos.position,
      ...multiplyScalar(...forward, direction * MOVE_SPEED * deltaTime)
    );
    log('cameraPosition', cameraPos.position)
  }

  if (inputKeys[KEY_LEFT] || inputKeys[KEY_RIGHT]) {
    console.log('right');
    const direction = inputKeys[KEY_LEFT] ? -1 : 1;
    cameraPos.rotation += direction * TURN_SPEED * deltaTime;
  }
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

  input(deltaTime);

  render(deltaTime);

  updateDebugInfo();

  requestAnimationFrame(update);
}

const loadAssets = async () => {
  trackData = await loadImageData('/assets/whacky-tracky.png')
}

const addListeners = () => {
  document.addEventListener('keydown', (event) => {
    event.preventDefault();
    inputKeys[event.key] = true;
  });

  document.addEventListener('keyup', (event) => {
    event.preventDefault();
    inputKeys[event.key] = false;
  });
}

const init = () => {
  canvas = document.getElementById('view');
  
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;

  ctx = canvas.getContext('2d');

  imgData = ctx.createImageData(VIEW_WIDTH, VIEW_HEIGHT);

  addListeners();

  loadAssets();

  requestAnimationFrame(update);
}

init();