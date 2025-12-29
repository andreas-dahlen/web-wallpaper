// input/nativeBridge.js
import { inputEngine } from './inputEngine'
import { log } from './debugInput'

// Receives normalized or raw coordinates from Kotlin / WebView
window.handleTouch = function (type, x, y) {
  log('input', 'logNative', type, x, y)

  const e = { clientX: x, clientY: y }

  switch (type) {
    case 'down':
      inputEngine._down(e)
      log('input', 'logNative', type, x, y)
      break
    case 'move':
      inputEngine._move(e)
      log('input', 'logNative', type, x, y)
      break
    case 'up':
      inputEngine._up(e)
      log('input', 'logNative', type, x, y)
      break
  }
}

// DEV helper for browser
if (import.meta.env.DEV) {
  window.simulateNativeTouch = window.handleTouch
}