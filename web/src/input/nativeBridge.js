import { inputEngine } from './inputEngine'

const DEV_SIMULATE_NATIVE = import.meta.env.DEV

const BASE_WIDTH = 364
const BASE_HEIGHT = 800

function normalize(x, y) {
  const appEl = document.getElementById('app')
  const rect = appEl?.getBoundingClientRect() || {
    left: 0,
    top: 0,
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  }

  // Prevent division by zero
  const w = rect.width || 1
  const h = rect.height || 1

  return {
    x: ((x - rect.left) / w) * BASE_WIDTH,
    y: ((y - rect.top) / h) * BASE_HEIGHT
  }
}

window.handleTouch = function (type, rawX, rawY) {
  const { x, y } = normalize(rawX, rawY)

  const eventLike = {
    clientX: x,
    clientY: y
  }

  // Debug once — remove later
  console.log('[nativeBridge]', type, x.toFixed(1), y.toFixed(1))

  switch (type) {
    case 'down':
      if (inputEngine && typeof inputEngine._handlePointerDown === 'function') {
        try {
          inputEngine._handlePointerDown(eventLike)
        } catch (err) {
          console.error('[nativeBridge] _handlePointerDown error', err)
        }
      }
      break
    case 'move':
      if (inputEngine && typeof inputEngine._handlePointerMove === 'function') {
        try {
          inputEngine._handlePointerMove(eventLike)
        } catch (err) {
          console.error('[nativeBridge] _handlePointerMove error', err)
        }
      }
      break
    case 'up':
      if (inputEngine && typeof inputEngine._handlePointerUp === 'function') {
        try {
          inputEngine._handlePointerUp(eventLike)
        } catch (err) {
          console.error('[nativeBridge] _handlePointerUp error', err)
        }
      }
      break
  }
}

if (DEV_SIMULATE_NATIVE) {
  window.simulateNativeTouch = (type, x, y) => {
    window.handleTouch(type, x, y)
  }
}
