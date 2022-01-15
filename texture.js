/* global Image */
const INVALID_PIXEL = [255, 128, 255, 255]

export const loadImageData = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { width, height } = img
      const loaderCanvas = document.createElement('canvas')
      const loaderCtx = loaderCanvas.getContext('2d')
      loaderCanvas.width = width
      loaderCanvas.height = height
      loaderCtx.drawImage(img, 0, 0, width, height)
      resolve(loaderCtx.getImageData(0, 0, width, height))
    }
    img.onerror = reject
    img.src = url
  })
}

const getPixelIndex = (imageData, x, y) => {
  if (x < 0 || y < 0 || x > imageData.width || y > imageData.height) {
    return -1
  }
  return (y * imageData.width * 4) + (x * 4)
}

export const setPixel = (imageData, x, y, r, g, b, a) => {
  const i = getPixelIndex(imageData, x, y)
  imageData.data[i] = r
  imageData.data[i + 1] = g
  imageData.data[i + 2] = b
  imageData.data[i + 3] = a
}

export const getPixel = (imageData, x, y) => {
  const i = getPixelIndex(imageData, x, y)
  if (i === -1) {
    return INVALID_PIXEL
  }
  return imageData.data.slice(i, i + 4)
}
