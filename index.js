import track1 from "./track1";

console.log(track1);

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 480;

let canvas;
let ctx;
let imgData;
let lastUpdateTime;
let shiftLeft = 0;

const getPixelFromInt32 = (value) => {
  const r = value & 0x00ff0000;
  const g = value & 0x0000ff00;
  const b = value & 0x000000ff;
  return [r, g, b, 255];
}

const getBitmapPixel = (bitmap, x, y) => {
  return getPixelFromInt32(bitmap[(y * VIEW_WIDTH) + x]);
}

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

const render = (deltaTime) => {
  const refPoint = 400;
  const pinch = 2;

  shiftLeft += 200 * deltaTime;

  for (let x = 0; x < VIEW_WIDTH; x++) {
    for (let y = 0; y < VIEW_HEIGHT; y++) {
      // const scaleXDir = x < (VIEW_WIDTH / 2) ? 1 : -1;
      const scaleX = 1 + (((y - refPoint) / 480) * pinch);
      const scaledWidth = VIEW_WIDTH * (1 / scaleX);
      const scaleOffset = Math.round(((scaledWidth / 2) - (VIEW_WIDTH / 2)) * -1);
      const iX = clamp(Math.round((x + shiftLeft + scaleOffset) * scaleX), 0, scaledWidth);
      // console.log(scaleX);
      setPixel(x, y, ...getBitmapPixel(track1, iX, y));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

const update = (time) => {
  const deltaTime = lastUpdateTime ? (time - lastUpdateTime) / 1000 : 0;
  lastUpdateTime = time;

  render(deltaTime);

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