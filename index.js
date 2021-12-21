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
const VIEW_ANGLE = 45;
const CAMERA_NEAR = 20;
const CAMERA_FAR = 350;
const DEG_2_RAD = Math.PI / 180;
const SCREEN_X_STEP = VIEW_WIDTH / FOV;
const SCREEN_FOV_STEP = FOV / VIEW_WIDTH;
const SCREEN_GROUND_HEIGHT = (VIEW_HEIGHT - GROUND_START);
const CAMERA_HEIGHT = 10;
// const NEAR_BOTTOM_OFFSET = CAMERA_HEIGHT - (CAMERA_NEAR * Math.sin(VIEW_ANGLE * DEG_2_RAD));
const NEAR_PLANE_HEIGHT = 2 * CAMERA_NEAR * Math.tan(VIEW_ANGLE / 2 * DEG_2_RAD);
const VIEW_Y_SCALE = NEAR_PLANE_HEIGHT / VIEW_HEIGHT;
const VIEW_ANGLE_STEP = (VIEW_ANGLE / 2) / SCREEN_GROUND_HEIGHT;
// const NEAR_PLANE_WIDTH = CAMERA_NEAR * Math.tan(FOV / 2 * DEG_2_RAD);
// const FAR_PLANE_WIDTH = CAMERA_FAR * Math.tan(FOV / 2 * DEG_2_RAD);
// const X_SCALE_STEP = (FAR_PLANE_WIDTH - NEAR_PLANE_WIDTH) / SCREEN_GROUND_HEIGHT;
const DEBUG_DISPLAY = document.getElementById('log');
const PIXEL_WHITE = [255, 255, 255, 255];

const VECTOR_UP = [0, -1];

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

let canvas;
let ctx;
let imgData;
let lastUpdateTime;
let trackData;
let cameraPos = {  position: [0, 0], rotation: 0 };

const getCameraForward = () => rotateVector(...VECTOR_UP, cameraPos.rotation);

const drawCircle = (x, y, radius, color = "red") => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 360 * DEG_2_RAD);
  ctx.stroke();
}

// const getPixelFromInt32 = (value) => {
//   const r = value & 0x00ff0000;
//   const g = value & 0x0000ff00;
//   const b = value & 0x000000ff;
//   return [r, g, b, 255];
// }

// const getBitmapPixel = (bitmap, x, y) => {
//   return getPixelFromInt32(bitmap[(y * VIEW_WIDTH) + x]);
// }

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

// const sample = (ratio) => Math.random() < ratio;
// const sampleIndices = (howMany, count) => {
//   const indices = [];
//   for (const i = 0; i < howMany; i++) {
//     indices.push(Math.round(Math.random() * (count - 1)));
//   }
//   return indices;
// }

const renderGround = () => {
  const cameraForward = getCameraForward();
  const cameraLeft = perpendicular(...cameraForward);
  const cameraRight = [
    -cameraLeft[0],
    -cameraLeft[1],
  ];

  const cameraOnGround = worldToGround(...cameraPos.position);
  drawCircle(...snapVector(...cameraOnGround), 5, 'blue');
  // drawCircle(...snapVector(...add(
  //   ...cameraOnGround,
  //   ...multiplyScalar(...cameraForward, 50),
  // )), 5, 'red');
  // drawCircle(...snapVector(...add(
  //   ...cameraOnGround,
  //   ...multiplyScalar(...cameraLeft, 50),
  // )), 5, 'green');
  // drawCircle(...snapVector(...add(
  //   ...cameraOnGround,
  //   ...multiplyScalar(...cameraRight, 50),
  // )), 5, 'orange');

  // for (let x = 0; x < VIEW_WIDTH; x++) {
  //   // screenRay = normalise(...rotateVector(...screenRay, SCREEN_FOV_STEP));
  //   const xAngle = ((x - xCentre) / xCentre) * halfFov;
  //   const ray = rotateVector(...VECTOR_UP, cameraPos.rotation + xAngle);
  //   const cosAngle = Math.cos(xAngle * DEG_2_RAD);
  //   const nearDistance = CAMERA_NEAR / cosAngle;
  //   // const farDistance = CAMERA_FAR / cosAngle;

  //   const nearPoint = add(
  //     ...multiplyScalar(...ray, nearDistance),
  //     ...cameraOnGround
  //   );
    // const farPoint = add(
    //   ...multiplyScalar(...ray, farDistance),
    //   ...cameraOnGround
    // );
    // drawCircle(...nearPoint, 5);
    // drawCircle(...farPoint, 5);

    // start at the top of the screen (far) and work our way down to near
    for (let y = 0; y < SCREEN_GROUND_HEIGHT; y++) {
      const worldY = CAMERA_HEIGHT - (y * VIEW_Y_SCALE);
      const viewAngle = 90 + (y * VIEW_ANGLE_STEP);
      const distanceAngle = 180 - viewAngle;

      // if (yAngle > 30) {
      //   continue;
      // }
      // Should not be using worldy
      const distanceFromNear = worldY * Math.tan(distanceAngle * DEG_2_RAD);
      const distance = CAMERA_NEAR + distanceFromNear;

      if (distance > CAMERA_FAR || distance < 0) {
        continue;
      }

      const viewWorldWidth = distance * Math.tan(FOV / 2 * DEG_2_RAD)
      // const scaledWidth = NEAR_PLANE_WIDTH * xScale;
      const halfWidth = (viewWorldWidth / 2);
      const xStep = viewWorldWidth / VIEW_WIDTH;
      const centrePoint = add(
        ...cameraOnGround,
        ...multiplyScalar(...cameraForward, distance)
      );
      // drawCircle(...snapVector(...centrePoint), 5);
      const leftPoint = add(
        ...centrePoint,
        ...multiplyScalar(...cameraLeft, halfWidth),
      );
      // drawCircle(...snapVector(...leftPoint), 5, 'green');

      // const groundPos = add(
      //   ...nearPoint,
      //   ...multiplyScalar(...ray, distance),
      // );
      // const ratio = 0.5 + (y - GROUND_START) / VIEW_HEIGHT;
      // const yStep = multiplyScalar(...screenRay, SCREEN_Y_STEP * yScale);
      // groundPos = add(...groundPos, ...yStep);
      // const rawCoord = (x * VIEW_WIDTH) + y;
      // if (!sample || rawCoord === sample) {
        // sample = rawCoord + 1;

      // }

      for (let x = 0; x < VIEW_WIDTH; x++) {
        const groundPos = add(
          ...leftPoint,
          ...multiplyScalar(...cameraRight, xStep * x),
        );
        // if (x % 50 && y === 100) {
          // drawCircle(...snapVector(...groundPos), 5, distance > 0 ? 'blue' : 'red');
        // }
        setPixel(x, SCREEN_GROUND_HEIGHT + y, ...getPixel(trackData, ...snapVector(...groundPos)));

      }
      
    }
  // }
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